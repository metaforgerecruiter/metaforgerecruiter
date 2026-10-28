"""
Split an email body into the sender's new text and the quoted reply/forward history.

Only the new text of a reply carries new information; quoted history repeats older
messages and must never create requirements or re-apply stale values. A forward is
the exception when the forwarded message itself came from the same trusted client.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# Outlook / Gmail reply and forward header blocks.
_QUOTE_START = re.compile(
    r"(?im)^[ \t]*(?:"
    r"From:(?:[ \t]+\S.*)?"                 # Outlook header block ("From: Name <addr>", or name on next line)
    r"|-{2,}[ \t]*(?:Original|Forwarded)[ \t]+Message[ \t]*-{2,}"
    r"|Begin forwarded message:"
    r"|On[ \t].{4,200}[ \t]wrote:"         # Gmail / Apple Mail
    r")[ \t]*$"
)
_EMAIL_IN_LINE = re.compile(r"[A-Za-z0-9._%+\-]+@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})")
_REPLY_SUBJECT = re.compile(r"^\s*(?:re|aw|sv)\s*:", re.I)
_FORWARD_SUBJECT = re.compile(r"^\s*(?:fw|fwd)\s*:", re.I)


@dataclass(frozen=True)
class ThreadParts:
    new_text: str                 # what the sender wrote in this message
    quoted_text: str              # everything from the first quoted header on ("" if none)
    first_quoted_block: str       # the most recent quoted message only (header + body)
    first_quoted_from_domain: str  # sender domain of that quoted message, if stated
    is_forward: bool
    is_reply: bool

    @property
    def has_quote(self) -> bool:
        return bool(self.quoted_text)


_HEADER_FOLLOW = re.compile(r"(?i)^\s*(?:sent|date|to|cc|subject)\s*:")


def _find_quote_start(body: str, start: int = 0) -> re.Match[str] | None:
    """First quoted header at or after `start`; a bare "From:" counts only inside a header block."""
    for m in _QUOTE_START.finditer(body, start):
        if not m.group(0).strip().lower().startswith("from:"):
            return m
        following = body[m.end():].lstrip("\r\n").splitlines()[:5]
        if any(_HEADER_FOLLOW.match(ln) for ln in following):
            return m
    return None


def split_thread(text: str, subject: str = "") -> ThreadParts:
    body = text or ""
    m = _find_quote_start(body)
    is_forward = bool(_FORWARD_SUBJECT.match(subject or ""))
    is_reply = bool(_REPLY_SUBJECT.match(subject or ""))
    if not m:
        return ThreadParts(body.strip(), "", "", "", is_forward, is_reply)

    new_text = body[: m.start()].strip()
    quoted = body[m.start():].strip()

    # The first quoted block ends where the next quoted header starts.
    nxt = _find_quote_start(quoted, 1)
    first_block = quoted[: nxt.start()].strip() if nxt else quoted

    # Sender address is on the "From:" line or the line after it (before "Sent:/To:").
    domain = ""
    header_lines = first_block.splitlines()[:4]
    for line in header_lines:
        if _HEADER_FOLLOW.match(line) and not line.strip().lower().startswith("from"):
            break
        dm = _EMAIL_IN_LINE.search(line)
        if dm:
            domain = dm.group(1).lower()
            break
    return ThreadParts(new_text, quoted, first_block, domain, is_forward, is_reply)


def domain_matches(domain: str, trusted: set[str] | frozenset[str]) -> bool:
    d = (domain or "").lower().strip(".")
    return any(d == t or d.endswith("." + t) for t in trusted)


def header_row_for(rows_text: str, history_text: str) -> str | None:
    """
    A client reply often repeats one table row without the column header, which stays in
    the quoted table. Return that header line (column names only) so the row can be
    mapped by column name. Never returns any requirement data.
    """
    if not rows_text or "|" not in rows_text:
        return None
    first_row = next((ln for ln in rows_text.splitlines() if ln.count("|") >= 2), "")
    if not first_row:
        return None
    if not re.search(r"\b\d{5,7}-\d{1,2}\b|\bRQ\d{4,8}\b", first_row, re.I):
        return None  # the new text already starts with something other than a data row
    ncols = len([c for c in first_row.split("|")])
    for ln in (history_text or "").splitlines():
        if ln.count("|") >= 2 and re.search(r"(?i)\b(?:request[\s-]*id|req[\s-]*id|so\s*id|demand\s*id)\b", ln):
            if abs(len(ln.split("|")) - ncols) <= 2:
                return ln.strip()
    return None
