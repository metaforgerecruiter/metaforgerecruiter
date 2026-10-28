"""
Two-Way Verification Engine (V1-V4, F1-F8).
Runs two independent extractors per requirement block:
  1. AI Engine
  2. Deterministic label/header extractor

Reconciliation Logic (V2):
  - Both agree -> accept.
  - One has value with verbatim quote in block and other is NULL -> accept, record recovered_by_<method>.
  - Different values -> store NULL, flag item for review, keep both candidates in review log.
  - No verbatim quote -> NULL.

Recall Guard (V3):
  - If block contains field label followed by non-placeholder value and final value is NULL,
    flag possible_miss and route to review.

Post-Save Verifier (V4):
  - Re-read stored values against source block, setting verification_status = verified or failed.
"""

from __future__ import annotations

import re
from typing import Any

from config import (
    FIELD_LABEL_SYNONYMS,
    is_placeholder,
    skills_from_requirement_sections,
    lpa_implies_inr,
)
from glossary import TermGlossary
from requirement_segmenter import strip_all_exclusion_zones

# Candidate template headers to strictly exclude from skills (F6)
CANDIDATE_TEMPLATE_HEADINGS = {
    "full name",
    "full name of the candidate",
    "name",
    "mobile no",
    "mobile number",
    "phone",
    "mail id",
    "email id",
    "email",
    "resumes sent date",
    "resumes sent date (ddmmyy)",
    "last full time qualification",
    "total experience",
    "relevant experience",
    "current ctc",
    "expected ctc",
    "notice period",
    "current location",
    "preferred location",
    "holding any offers",
    "pan number",
    "dob",
    "highlighted",
    "must have",
    "must have highlighted",
    "monthly billing rates",
    "monthly billing rate",
    "billing rates",
    "billing rate",
}

# A line that is itself another field ("Location - Pune", "Notice Period:") ends an empty label's value.
_CORE_LABEL_RX = re.compile(
    r"(?i)^\s*[-*•]?\s*(?:"
    + "|".join(sorted({re.escape(l) for v in FIELD_LABEL_SYNONYMS.values() for l in v}, key=len, reverse=True))
    + r")\s*[:=\-–—|]"
)
# Side facts clients put between a label and its list ("Work hrs – 12 PM – 10 PM", "Customer discussion – No").
_SIDE_LABEL_RX = re.compile(
    r"(?i)^\s*[-*•]?\s*(?:work(?:ing)?\s*h(?:ou)?rs?|shift(?:\s*timings?)?|timings?|customer\s*discussion|"
    r"qualification(?:\s*criteria)?|education|interview(?:\s*mode)?|mode\s*of\s*interview|bgv|joining|duration|tenure)"
    r"\b[^:=\-–—|]{0,15}[:=\-–—|]"
)
_GENERIC_ROLE_WORDS = {
    "engineer", "engineers", "application", "applications", "developer", "analyst", "consultant", "lead",
    "manager", "senior", "junior", "sr", "jr", "architect", "specialist", "associate", "executive", "tester",
    "administrator", "admin", "support", "expert", "professional", "trainee", "intern", "head", "principal",
    "staff", "technician", "officer", "role", "position", "requirement", "resource",
}
_STRONG_TITLE_LABEL_RX = re.compile(
    r"(?i)^\s*[-*•]?\s*(?:job\s*title|role\s*title|position\s*title|position\s*/\s*title|designation)\b"
)


def is_junk_skill(skill: Any, job_title: str | None = None) -> bool:
    """Values that are never skills: clock times, shift hours, bare role words."""
    low = re.sub(r"\s+", " ", str(skill or "")).strip(" .:-–—|\t•·*").lower()
    if not low:
        return True
    # Section headings.
    if low in {"job description", "jd", "detailed jd", "key responsibilities", "responsibilities", "requirements",
               "qualifications", "roles & responsibilities", "roles and responsibilities", "skills", "mandatory skills"}:
        return True
    if re.fullmatch(r"\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|hrs?|hours?)", low):
        return True
    if re.search(r"\bwork(?:ing)?\s*h(?:ou)?rs?\b|\bshift\s*timings?\b|\d{1,2}\s*(?:am|pm)\s*(?:-|to|–)\s*\d{1,2}\s*(?:am|pm)", low):
        return True
    if low in _GENERIC_ROLE_WORDS:
        return True
    # Instructions, rates and fragments that sit near skill lines but are not skills.
    if re.search(
        r"supplier comments|mandatory while sharing|sharing the profile|customer round|\btpc rates?\b|"
        r"\bbill rate\b|^\(?\d+\s*\+?\s*(?:yrs?|years?)\)?$|\b\d{1,2}\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:yrs?|years?)\s*[-–—:]\s*\d",
        low,
    ):
        return True
    if re.fullmatch(r"[\d\s,.:/()+\-–—]+", low):
        return True
    # Pieces of a split "(Y/N): Yes" answer.
    if re.fullmatch(r"[yn]\)?\s*:?\s*(?:yes|no)?|.*\(y", low):
        return True
    # A skill equal to the title is kept: client tables often have a "Skill" column that names the role
    # ("SAP Profitability & Performance Mgt PaPM").
    return False


def _value_after_empty_label(text_from_value: str) -> str | None:
    """
    The label had nothing on its own line ("Mandatory Skills –"). Take the first following line that is a
    plain value, skipping side facts like "Work hrs – 12 PM – 10 PM"; another field's label means the
    label is empty.
    """
    for ln in [l.strip() for l in text_from_value.splitlines() if l.strip()][:4]:
        if _CORE_LABEL_RX.match(ln) or re.match(r"^\s*[-*•]?\s*[A-Za-z][^:|]{0,50}:\s*$", ln):
            return None
        if _SIDE_LABEL_RX.match(ln):
            continue
        return ln.strip(" :-–—|\t") or None
    return None


_EXP_SEGMENT_RX = re.compile(
    r"(?i)\b\d{1,2}(?:\.\d)?\s*\+?\s*(?:(?:-|–|—|to)\s*\d{1,2}(?:\.\d)?\s*)?(?:yrs?|years?)\b"
)
_BUDGET_TIER_RX = re.compile(
    r"(?i)^\s*[-*•]?\s*\d{1,2}(?:\.\d)?\s*\+?\s*(?:(?:-|–|—|to)\s*\d{1,2}(?:\.\d)?\s*)?(?:yrs?|years?)\b"
    r".*?(?:\d+(?:\.\d+)?\s*(?:k|l|lpa|lakhs?|cr)\b|\d{5,}|\d[\d,]{4,})"
)


_BUDGET_TIER_LABEL_RX = re.compile(
    r"(?i)^\s*[-*•]?\s*\d{1,2}(?:\.\d)?\s*\+?\s*(?:(?:-|–|—|to)\s*\d{1,2}(?:\.\d)?\s*)?(?:yrs?|years?)\s*[-–—:]?\s*$"
)
_BUDGET_AMOUNT_ONLY_RX = re.compile(r"(?i)^\s*[-–—:]?\s*\d+(?:\.\d+)?\s*(?:k|l|lpa|lakhs?|cr)\b|^\s*[-–—:]?\s*\d[\d,]{4,}")


def _budget_tier_continuation(clean_block: str, first_value: str) -> list[str]:
    """
    Lines right after the budget value that are further experience tiers with an amount. A tier may be
    broken over two lines ("5 - 7 yrs" / "- 1.25 L").
    """
    norm = lambda t: re.sub(r"\s+", " ", t.replace("\xa0", " ")).strip()
    lines = [norm(l) for l in clean_block.splitlines()]
    target = norm(first_value).lower()
    for i, ln in enumerate(lines):
        if not (target and target in ln.lower()):
            continue
        out: list[str] = []
        j = i + 1
        while j < len(lines) and len(out) < 6:
            nxt = lines[j]
            if not nxt:
                j += 1
                continue
            if _BUDGET_TIER_RX.match(nxt):
                out.append(nxt.strip(" -–—*•"))
                j += 1
            elif _BUDGET_TIER_LABEL_RX.match(nxt) and j + 1 < len(lines) and _BUDGET_AMOUNT_ONLY_RX.match(lines[j + 1]):
                out.append(f"{nxt.strip(' -–—*•:')} - {lines[j + 1].strip(' -–—:')}")
                j += 2
            else:
                break
        return out
    return []


def _labelled_evidence(field: str, det_quote: Any, clean_block: str) -> bool:
    """The deterministic value comes from the client's own label line in this block."""
    q = str(det_quote or "").strip()
    if not q:
        return False
    first = q.splitlines()[0]
    norm = lambda t: re.sub(r"\s+", " ", t).strip().lower()
    if norm(first) not in norm(clean_block):
        return False
    if field == "job_title":
        return bool(_STRONG_TITLE_LABEL_RX.match(first))
    return True


def _find_verbatim_quote(val_str: str, block_text: str) -> str | None:
    """Find exact or case-insensitive verbatim quote in the block text."""
    if not val_str or not block_text:
        return None
    val_clean = val_str.strip()
    if not val_clean:
        return None
    if val_clean in block_text:
        return val_clean
    # Case-insensitive search
    m = re.search(re.escape(val_clean), block_text, re.IGNORECASE)
    if m:
        return m.group(0)
    # Match without punctuation
    words = [w for w in re.split(r"\s+", val_clean) if w]
    if words:
        pat = r"\s+".join(re.escape(w) for w in words)
        m = re.search(pat, block_text, re.IGNORECASE)
        if m:
            return m.group(0)
    return None


def parse_experience_digits(exp_str: str | None) -> tuple[float | None, float | None]:
    """F2: experience_min_years and experience_max_years only from digits stated."""
    if not exp_str:
        return None, None
    s = str(exp_str).strip()
    # 5-7 years / 5 to 7 years / 5 – 7 years / 5 — 7 years
    m_range = re.search(r"(\d+(?:\.\d+)?)\s*(?:[-–—~]|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)?", s, re.I)
    if m_range:
        return float(m_range.group(1)), float(m_range.group(2))
    # 6+ years / 6 + years / min 6 years / more than 6 years
    m_plus = re.search(r"(?:more\s+than\s+|min(?:imum)?\s+)?(\d+(?:\.\d+)?)\s*(?:\+|\b)\s*(?:years?|yrs?)", s, re.I)
    if m_plus:
        return float(m_plus.group(1)), None
    # single number: "8 years" -> min 8, max None
    m_single = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:years?|yrs?|\+)?\b", s, re.I)
    if m_single:
        return float(m_single.group(1)), None
    return None, None


def parse_work_mode(text: str | None) -> tuple[str | None, str | None]:
    """
    F8 work_mode: work_mode_text verbatim.
    work_mode is On-site, Hybrid or Remote only for an explicit single term.
    If multiple ("Hybrid/Remote") or unclear, work_mode is NULL and text is kept.
    """
    if not text or is_placeholder(text):
        return None, None
    wm_text = str(text).strip()
    norm = TermGlossary.normalize_work_mode(wm_text)
    return norm, wm_text


def parse_budget_details(raw_budget: str | None) -> dict[str, Any]:
    """
    F3 & F4: budget_text verbatim; amount (min/max), unit, period only as stated.
    No conversion; currency only if written.
    Words like 'negotiable' stay in budget_text, numbers stay NULL.
    monthly_budget only when stated monthly (never derived from yearly/LPA).
    """
    res: dict[str, Any] = {
        "budget_text": None,
        "yearly_budget": None,
        "yearly_budget_min": None,
        "yearly_budget_max": None,
        "monthly_budget": None,
        "monthly_budget_min": None,
        "monthly_budget_max": None,
        "budget_currency": None,
    }
    if not raw_budget or is_placeholder(raw_budget):
        return res

    b_text = str(raw_budget).strip()
    # Experience-tiered rates ("3 – 4 yrs – 95 K / 5 + yrs – 1.3 L") are longer than a plain budget.
    is_body_like = (
        len(b_text) > (220 if _EXP_SEGMENT_RX.search(b_text) else 80)
        or "\n" in b_text
        or any(w in b_text.lower() for w in ("dear", "kindly", "hello", "hi ", "regards", "candidate", "partner", "submission", "resume", "pls ensure", "subject line"))
    )
    res["budget_text"] = None if is_body_like else b_text
    lower = b_text.lower()

    # Detect currency strictly if stated (F3, A5)
    if re.search(r"(?:inr|rs\.?|₹)", lower):
        res["budget_currency"] = "INR"
    elif re.search(r"(?:usd|\$)", lower):
        res["budget_currency"] = "USD"
    elif re.search(r"(?:eur|€)", lower):
        res["budget_currency"] = "EUR"
    elif re.search(r"(?:gbp|£)", lower):
        res["budget_currency"] = "GBP"
    elif lpa_implies_inr() and re.search(r"\blpa\b", lower):
        res["budget_currency"] = "INR"
    elif re.search(r"\b\d{1,2},\d{2},\d{3}\b", b_text) or "lpm" in lower or "/ m" in lower or "/m" in lower:
        res["budget_currency"] = "INR"

    # Non-numeric phrases stay in budget_text; numbers stay NULL (F3)
    if any(p in lower for p in ["negotiable", "as per market", "competitive", "market standards", "best in industry"]):
        if not re.search(r"\d", lower):
            return res

    # Detect period: monthly vs yearly (F4)
    is_monthly = bool(re.search(r"\b(?:per\s+month|/month|p\.?m\.?|monthly|bill\s+rate|rate\s*/\s*pm|tpc\s+rates?)\b", lower))
    is_yearly = bool(re.search(r"\b(?:per\s+annum|/annum|p\.?a\.?|annually|yearly|lpa)\b", lower))

    # Extract digits: range or single (strip commas between digits like 80,000)
    clean_digits_text = re.sub(r"(?<=\d),(?=\d)", "", b_text)
    # Experience tiers ("3 – 4 yrs", "8 to 10 years", "5 + yrs") are not amounts.
    is_tiered = bool(_EXP_SEGMENT_RX.search(clean_digits_text))
    amount_text = _EXP_SEGMENT_RX.sub(" ", clean_digits_text)
    tier_vals: list[float] = []
    for kv, lv, plain in re.findall(r"(\d+(?:\.\d+)?)\s*k\b|(\d+(?:\.\d+)?)\s*(?:l\b|lakhs?\b)|(\d{5,7}(?:\.\d+)?)", amount_text, re.I):
        if kv:
            tier_vals.append(float(kv) * 1000)
        elif lv:
            tier_vals.append(float(lv) * 100000)
        elif plain:
            tier_vals.append(float(plain))
    if (is_tiered or "rate" in lower or "tpc" in lower or "tier" in lower) and len(tier_vals) >= 2 and not is_yearly:
        # One requirement, several experience bands: the monthly range spans all bands; the text keeps them.
        res["budget_currency"] = res["budget_currency"] or "INR"
        res["monthly_budget_min"] = min(tier_vals)
        res["monthly_budget_max"] = max(tier_vals)
        res["monthly_budget"] = max(tier_vals)
        if not res["budget_text"]:
            res["budget_text"] = f"{int(min(tier_vals)):,} - {int(max(tier_vals)):,} / month"
        return res
    clean_digits_text = amount_text if is_tiered else clean_digits_text

    m_range = re.search(r"(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)", clean_digits_text)
    m_k = re.search(r"(\d+(?:\.\d+)?)\s*k\b", clean_digits_text, re.I)
    m_lakh = re.search(r"(\d+(?:\.\d+)?)\s*(?:l\b|lakhs?|lpa\b|lpm\b)", clean_digits_text, re.I)
    m_single = re.search(r"\b(\d+(?:\.\d+)?)\b", clean_digits_text)

    if is_monthly and not is_yearly:
        if m_range:
            res["monthly_budget_min"] = float(m_range.group(1))
            res["monthly_budget_max"] = float(m_range.group(2))
            res["monthly_budget"] = float(m_range.group(2))
        elif m_k:
            val = float(m_k.group(1)) * 1000
            res["monthly_budget"] = val
            res["monthly_budget_min"] = val
            res["monthly_budget_max"] = val
        elif m_lakh:
            val = float(m_lakh.group(1)) * 100000
            res["monthly_budget"] = val
            res["monthly_budget_min"] = val
            res["monthly_budget_max"] = val
        elif m_single:
            res["monthly_budget"] = float(m_single.group(1))
            res["monthly_budget_min"] = float(m_single.group(1))
            res["monthly_budget_max"] = float(m_single.group(1))
    elif is_yearly or "lpa" in lower or ("lakh" in lower and not is_monthly):
        if m_range:
            res["yearly_budget_min"] = float(m_range.group(1))
            res["yearly_budget_max"] = float(m_range.group(2))
        elif m_single:
            res["yearly_budget"] = float(m_single.group(1))
            res["yearly_budget_min"] = float(m_single.group(1))
    else:
        # Default numeric assignment without unit assumption
        if m_range:
            v1, v2 = float(m_range.group(1)), float(m_range.group(2))
            if 20000 <= v1 <= 500000 and 20000 <= v2 <= 500000:
                res["monthly_budget_min"] = v1
                res["monthly_budget_max"] = v2
            else:
                res["yearly_budget_min"] = v1
                res["yearly_budget_max"] = v2
        elif m_k:
            val = float(m_k.group(1)) * 1000
            res["monthly_budget"] = val
            res["monthly_budget_min"] = val
            res["monthly_budget_max"] = val
        elif m_single:
            val = float(m_single.group(1))
            if 20000 <= val <= 500000 or "rate" in lower or "tpc" in lower:
                res["monthly_budget"] = val
                res["monthly_budget_min"] = val
            else:
                res["yearly_budget"] = val
                res["yearly_budget_min"] = val

    if is_body_like:
        if res.get("monthly_budget"):
            res["budget_text"] = f"{int(res['monthly_budget']):,} / month"
        elif res.get("yearly_budget"):
            res["budget_text"] = f"{res['yearly_budget']} LPA"
        else:
            res["budget_text"] = None

    return res


def deterministic_extract_block(block_text: str, client_name: str | None = None) -> dict[str, Any]:
    """
    Deterministic extractor (V1):
    Extracts all 8 fields using label synonyms and boundary patterns on isolated clean requirement block.
    Returns field values, parsed subfields, and exact verbatim quotes.
    """
    clean_block = strip_all_exclusion_zones(block_text).replace("\xa0", " ")  # non-breaking spaces break label matching
    quotes: dict[str, str] = {}
    extracted: dict[str, Any] = {
        "job_title": None,
        "location": None,
        "experience": None,
        "experience_text": None,
        "experience_min_years": None,
        "experience_max_years": None,
        "number_of_positions": None,
        "budget": None,
        "budget_text": None,
        "budget_currency": None,
        "yearly_budget": None,
        "yearly_budget_min": None,
        "yearly_budget_max": None,
        "monthly_budget": None,
        "monthly_budget_min": None,
        "monthly_budget_max": None,
        "mandatory_skills": None,
        "skills": None,
        "notice_period": None,
        "work_mode": None,
        "work_mode_text": None,
        "quotes": quotes,
    }

    lines = [line.strip() for line in clean_block.splitlines() if line.strip()]

    # Helper to find lines matching label patterns
    def extract_label_value(labels: tuple[str, ...]) -> tuple[str | None, str | None]:
        is_pos_query = any("position" in l or "headcount" in l or "opening" in l for l in labels)
        for lbl in labels:
            # A label may carry a note before its separator: "Bill Rate per month for TPC (in terms of INR) –".
            lbl_rx = re.escape(lbl) + r"(?:[ \t]*\([^)\n]*\))?"
            pat = rf"(?i)^\s*(?:[-*•]\s*)?{lbl_rx}\s*[:=\-–—|]\s*(.+)$"
            for line in lines:
                m = re.match(pat, line)
                if m:
                    val = m.group(1).strip()
                    if val and not is_placeholder(val):
                        if not is_pos_query and re.search(r"(?i)\b(?:open\s*positions?|positions?\s*[-:]?\s*\d)\b", m.group(0)):
                            continue
                        return val, m.group(0)
            # Multiline lookup on same line
            # Value on the label's own line only; an empty label is handled by the next-line lookup below.
            m_multi = re.search(rf"(?im)^[ \t]*(?:[-*•][ \t]*)?{lbl_rx}[ \t]*[:=\-–—|][ \t]*([^\n\r]*\S)", clean_block)
            if m_multi:
                val = m_multi.group(1).strip()
                if val and not is_placeholder(val):
                    if not is_pos_query and re.search(r"(?i)\b(?:open\s*positions?|positions?\s*[-:]?\s*\d)\b", m_multi.group(0)):
                        continue
                    return val, m_multi.group(0)
            # Multiline lookup with value on next line or separated across lines (e.g. Overall exp\n–\n5-8 Years)
            m_nl = re.search(rf"(?im)^\s*(?:[-*•]\s*)?{lbl_rx}[ \t]*(?:[:=\-–—|][ \t]*)?(?:\r?\n\s*[:=\-–—|]?\s*)+([^\r\n]+)", clean_block)
            if m_nl:
                # An empty form label ("Location:") followed by another label ("Notice Period in days:")
                # has no value; don't take the next label as the answer.
                if re.match(r"^\s*[-*•]?\s*[A-Za-z][^:|]{0,50}:\s*$", m_nl.group(1)):
                    continue
                val = _value_after_empty_label(clean_block[m_nl.start(1):])
                if val and not is_placeholder(val):
                    if not is_pos_query and re.search(r"(?i)\b(?:open\s*positions?|positions?\s*[-:]?\s*\d)\b", m_nl.group(0)):
                        continue
                    # Quote from the label through the line the value came from (side facts may sit between).
                    val_at = clean_block.find(val, m_nl.start(1))
                    quote = clean_block[m_nl.start():val_at + len(val)].strip() if val_at >= 0 else m_nl.group(0)
                    return val, quote
        return None, None

    # 1. Job Title
    title_labels = ("job title", "role title", "position title", "designation", "profile", "requirement for", "requirement", "role", "hiring for")
    raw_title, quote_title = extract_label_value(title_labels)
    if raw_title and not is_placeholder(raw_title):
        extracted["job_title"] = raw_title
        quotes["job_title"] = quote_title or raw_title
    else:
        # Check first line if it looks like a role title
        if lines and len(lines[0]) < 80 and not any(w in lines[0].lower() for w in ["hi", "dear", "hello", "team", "regards"]):
            first_line = lines[0].strip(" -:*•")
            if re.search(r"(?i)\b(?:developer|engineer|lead|consultant|architect|manager|analyst|specialist)\b", first_line):
                extracted["job_title"] = first_line
                quotes["job_title"] = lines[0]

    # 2. Location (F1)
    raw_loc, quote_loc = extract_label_value(FIELD_LABEL_SYNONYMS["location"])
    if raw_loc and not is_placeholder(raw_loc):
        # City/cities/region exactly as written ("PAN India", "Bangalore(BDC-7)")
        loc_parts = [p.strip() for p in re.split(r"[,/|;]+", raw_loc) if p.strip() and not is_placeholder(p.strip())]
        if loc_parts:
            extracted["location"] = loc_parts
            quotes["location"] = quote_loc or raw_loc

    # 3. Experience (F2)
    raw_exp, quote_exp = extract_label_value(FIELD_LABEL_SYNONYMS["experience"])
    if raw_exp and not is_placeholder(raw_exp):
        extracted["experience_text"] = raw_exp
        extracted["experience"] = raw_exp
        min_y, max_y = parse_experience_digits(raw_exp)
        extracted["experience_min_years"] = min_y
        extracted["experience_max_years"] = max_y
        quotes["experience"] = quote_exp or raw_exp

    # 4. Budget (F3, F4)
    raw_bgt, quote_bgt = extract_label_value(FIELD_LABEL_SYNONYMS["budget"])
    if raw_bgt and not is_placeholder(raw_bgt):
        is_bl = (
            len(raw_bgt) > 80
            or "\n" in raw_bgt
            or any(w in raw_bgt.lower() for w in ("dear", "kindly", "hello", "hi ", "regards", "candidate", "partner", "submission", "resume"))
        )
        if not is_bl:
            # Tiered rates continue on the next lines ("3 – 4 yrs – 90 K" / "5 + yrs – 1.3 L"): keep every tier.
            tiers = _budget_tier_continuation(clean_block, raw_bgt)
            if tiers:
                raw_bgt = " / ".join([raw_bgt] + tiers)
                quote_bgt = "\n".join([quote_bgt or ""] + tiers).strip()
            bgt_dict = parse_budget_details(raw_bgt)
            # "Bill Rate per month for TPC – 2.1 L": the label states the period the value leaves out.
            label_line = str(quote_bgt or "").splitlines()[0] if quote_bgt else ""
            if re.search(r"(?i)per\s*month|/\s*month|monthly|/\s*pm\b|\bpm\b", label_line) and not bgt_dict.get("monthly_budget_min"):
                monthly = parse_budget_details(f"{raw_bgt} per month")
                if monthly.get("monthly_budget_min"):
                    monthly["budget_text"] = bgt_dict.get("budget_text") or raw_bgt
                    bgt_dict = monthly
            extracted.update(bgt_dict)
            extracted["budget"] = bgt_dict.get("budget_text") or raw_bgt
            quotes["budget"] = quote_bgt or raw_bgt

    # 5. Mandatory Skills (F5)
    raw_mand, quote_mand = extract_label_value(FIELD_LABEL_SYNONYMS["mandatory_skills"])
    if raw_mand and not is_placeholder(raw_mand):
        def _parse_mand_tokens(raw: str) -> list[str]:
            raw_c = raw.strip().rstrip('.')
            chunks = re.split(r'(?:[,\n;|•*]|\s+&\s+|\s+and\s+)+', raw_c)
            res = []
            for c in chunks:
                c = c.strip(' .:-–—\t')
                if not c:
                    continue
                sub_tokens = re.split(r'\s+(?=(?:C\+\+|Rust|C#|Python|Java|React|Go|Golang)\b)|\s+[-–—]\s+', c, flags=re.I)
                for st in sub_tokens:
                    st = st.strip(' :-–—\t').rstrip('.')
                    if not st.lower().startswith('.net'):
                        st = st.lstrip('.')
                    if st and (len(st) > 1 or st.upper() in ("C", "R")):
                        res.append(st)
            return res or [raw_c]

        mand_skills = _parse_mand_tokens(raw_mand)
        # Never job title, never candidate template headers (F5, F6)
        jt_lower = (extracted.get("job_title") or "").strip().lower()
        mand_skills = [
            s for s in mand_skills
            if s.lower() != jt_lower and s.lower() not in CANDIDATE_TEMPLATE_HEADINGS
        ]
        if mand_skills:
            extracted["mandatory_skills"] = mand_skills
            quotes["mandatory_skills"] = quote_mand or raw_mand

    # 6. Skills (F6)
    raw_sk, quote_sk = extract_label_value(FIELD_LABEL_SYNONYMS["skills"])
    if raw_sk and not is_placeholder(raw_sk):
        sec_skills = [
            s.strip()
            for s in re.split(r"[,\n;/|•*]+", raw_sk)
            if s.strip() and not is_placeholder(s.strip())
        ]
        jt_lower = (extracted.get("job_title") or "").strip().lower()
        mand_set = set(s.lower() for s in (extracted.get("mandatory_skills") or []))
        sec_skills = [
            s for s in sec_skills
            if s.lower() != jt_lower
            and s.lower() not in CANDIDATE_TEMPLATE_HEADINGS
            and s.lower() not in mand_set
        ]
        if sec_skills:
            extracted["skills"] = sec_skills
            quotes["skills"] = quote_sk or raw_sk

    # Also extract technologies from JD requirement sections if enabled (F6)
    if skills_from_requirement_sections() and not extracted.get("skills"):
        # Look for JD / Requirement section mentioning tech
        m_tech = re.search(
            r"(?is)(?:job\s+description|jd|responsibilities|qualifications|role\s+summary|about\s+the\s+role|detailed\s+jd)\s*[:=\-–—|]?\s*(.+?)(?=\n\s*(?:skills|location|ctc|budget|notice|regards|$))",
            clean_block,
        )
        if m_tech:
            jd_text = m_tech.group(1)
            # Find recognized technology terms
            found_techs: list[str] = []
            mand_set = set(s.lower() for s in (extracted.get("mandatory_skills") or []))
            common_techs = [
                "Java", "Spring Boot", "AWS", "Python", "SQL", "Docker", "Kubernetes",
                "Azure", "GCP", "React", "Angular", "Node.js", "C++", "C#", ".NET",
                "Kafka", "Microservices", "SAP", "ABAP", "Snowflake", "Databricks",
                "Rust", "GitLab", "Jira", "Linux", "LAN", "Cyber Security",
                "PLC", "DCS", "Emerson DeltaV", "DeltaV", "Automation",
            ]
            for tech in common_techs:
                if re.search(rf"\b{re.escape(tech)}\b", jd_text, re.I):
                    if tech.lower() not in mand_set and tech.lower() != (extracted.get("job_title") or "").lower():
                        found_techs.append(tech)
            if found_techs:
                extracted["skills"] = found_techs
                quotes["skills"] = m_tech.group(0)[:100]

    # 7. Notice Period (F7)
    raw_np, quote_np = extract_label_value(FIELD_LABEL_SYNONYMS["notice_period"])
    if raw_np and not is_placeholder(raw_np) and raw_np.strip().lower() not in CANDIDATE_TEMPLATE_HEADINGS:
        extracted["notice_period"] = raw_np
        quotes["notice_period"] = quote_np or raw_np

    # 8. Work Mode (F8)
    raw_wm, quote_wm = extract_label_value(FIELD_LABEL_SYNONYMS["work_mode"])
    if raw_wm and not is_placeholder(raw_wm):
        norm_wm, wm_text = parse_work_mode(raw_wm)
        extracted["work_mode"] = norm_wm
        extracted["work_mode_text"] = wm_text
        quotes["work_mode"] = quote_wm or raw_wm
    else:
        # Check explicit standalone work arrangement patterns only (never arbitrary words like 'remote' or 'office' in technical skills)
        m_arr = re.search(r"(?im)^\s*(?:[-*•]\s*)?(?:(?:work\s+model|work\s+mode|mode\s+of\s+work)\s*[:\-–—]\s*)?(hybrid\s*,\s*\d+\s*days?\s*(?:in\s*)?office|fully\s+remote|100%\s*remote|work\s+from\s+home|wfh|wfo|work\s+from\s+office)\b", clean_block)
        if m_arr:
            raw_wm = m_arr.group(1).strip()
            norm_wm, wm_text = parse_work_mode(raw_wm)
            if norm_wm or wm_text:
                extracted["work_mode"] = norm_wm
                extracted["work_mode_text"] = wm_text
                quotes["work_mode"] = m_arr.group(0).strip()

    # 9. Number of Positions / Headcount
    pos_labels = FIELD_LABEL_SYNONYMS.get(
        "number_of_positions",
        ("open positions", "open position", "positions", "openings", "number of positions", "no of positions", "headcount"),
    )
    raw_pos, quote_pos = extract_label_value(pos_labels)
    if raw_pos and not is_placeholder(raw_pos):
        m_p = re.search(r"\b(\d{1,3})\b", raw_pos)
        if m_p:
            try:
                extracted["number_of_positions"] = int(m_p.group(1))
                quotes["number_of_positions"] = quote_pos or raw_pos
            except ValueError:
                pass

    return extracted


def reconcile_two_way(
    ai_item: dict[str, Any],
    det_item: dict[str, Any],
    block_text: str,
) -> tuple[dict[str, Any], bool, list[str]]:
    """
    Two-Way Verification (V2) & Recall Guard (V3).
    Returns (reconciled_item, review_required, review_reasons).
    """
    clean_block = strip_all_exclusion_zones(block_text).replace("\xa0", " ")  # non-breaking spaces break label matching
    reconciled = dict(ai_item)
    review_required = False
    review_reasons: list[str] = []
    recovered_by: dict[str, str] = dict(ai_item.get("recovered_by") or {})
    review_candidates: dict[str, Any] = dict(ai_item.get("review_candidates") or {})
    evidence_quotes: dict[str, str] = dict(ai_item.get("field_evidence_quotes") or {})

    det_quotes = det_item.get("quotes") or {}

    fields_to_check = [
        "job_title",
        "location",
        "experience",
        "number_of_positions",
        "budget",
        "mandatory_skills",
        "skills",
        "notice_period",
        "work_mode",
    ]

    for field in fields_to_check:
        ai_val = ai_item.get(field)
        det_val = det_item.get(field)

        # Normalize values for comparison
        def norm_val(v: Any) -> Any:
            if v is None or is_placeholder(v):
                return None
            if isinstance(v, list):
                res = sorted([str(x).strip().lower() for x in v if not is_placeholder(x)])
                if len(res) == 1:
                    return res[0]
                return res if res else None
            return str(v).strip().lower()

        ai_norm = norm_val(ai_val)
        det_norm = norm_val(det_val)

        # Case 1: Both agree
        if ai_norm is not None and ai_norm == det_norm:
            # Verified by both!
            quote = det_quotes.get(field) or _find_verbatim_quote(str(ai_val), clean_block)
            if quote:
                evidence_quotes[field] = quote
            recovered_by[field] = "two_way_agreement"
            reconciled[field] = ai_val

        # Case 2: One has value with verbatim quote in block, other is NULL
        elif ai_norm is not None and det_norm is None:
            # AI has value, deterministic is NULL
            matching_quotes = []
            if isinstance(ai_val, list):
                for x in ai_val:
                    q = _find_verbatim_quote(str(x), clean_block)
                    if q:
                        matching_quotes.append(q)
            else:
                q = _find_verbatim_quote(str(ai_val), clean_block)
                if q:
                    matching_quotes.append(q)

            if matching_quotes:
                evidence_quotes[field] = "; ".join(matching_quotes[:3])
                recovered_by[field] = "recovered_by_ai"
            else:
                recovered_by[field] = "ai_extracted_unverified"

            # Always preserve the extracted value - never silently replace with None!
            reconciled[field] = ai_val

        elif det_norm is not None and ai_norm is None:
            # Deterministic has value, AI is NULL
            quote = det_quotes.get(field) or _find_verbatim_quote(str(det_val), clean_block)
            reconciled[field] = det_val
            if quote:
                evidence_quotes[field] = quote
            recovered_by[field] = "recovered_by_deterministic"
            # Also propagate subfields if experience or budget
            if field == "experience":
                if det_item.get("experience_text"):
                    reconciled["experience_text"] = det_item.get("experience_text")
                if det_item.get("experience_min_years") is not None:
                    reconciled["experience_min_years"] = det_item.get("experience_min_years")
                if det_item.get("experience_max_years") is not None:
                    reconciled["experience_max_years"] = det_item.get("experience_max_years")
            elif field == "budget":
                for bk in ["budget_text", "yearly_budget", "yearly_budget_min", "yearly_budget_max", "monthly_budget", "monthly_budget_min", "monthly_budget_max", "budget_currency"]:
                    if det_item.get(bk) is not None:
                        reconciled[bk] = det_item.get(bk)
            elif field == "number_of_positions":
                if det_item.get("number_of_positions") is not None:
                    reconciled["number_of_positions"] = det_item.get("number_of_positions")
            elif field == "work_mode":
                if det_item.get("work_mode_text"):
                    reconciled["work_mode_text"] = det_item.get("work_mode_text")

        # Case 3: Different values -> preserve best candidate, do not store NULL!
        elif ai_norm is not None and det_norm is not None and ai_norm != det_norm:
            # Two different answers are never merged (that mixes data, e.g. subject region + body city).
            # The client's own labelled line wins; otherwise the AI value stays. The conflict is recorded.
            def _no_headings(v: Any) -> Any:
                if not isinstance(v, list):
                    return v
                return [x for x in v if str(x).lower().strip() not in CANDIDATE_TEMPLATE_HEADINGS]

            det_wins = _labelled_evidence(field, det_quotes.get(field), clean_block)
            det_pick = _no_headings(det_val)
            if field in ("mandatory_skills", "skills"):
                # Skills from the same requirement block complement each other (the labelled line plus the
                # JD's specifics): combine them, dropping junk. Scalars below are never combined.
                combined: list[Any] = []
                seen_sk: set[str] = set()
                for x in (ai_val if isinstance(ai_val, list) else [ai_val]) + (det_pick if isinstance(det_pick, list) else [det_pick]):
                    k = re.sub(r"\s+", " ", str(x or "")).strip().lower()
                    if not k or k in seen_sk or k in CANDIDATE_TEMPLATE_HEADINGS or is_junk_skill(x):
                        continue
                    seen_sk.add(k)
                    combined.append(x)
                reconciled[field] = combined
            elif det_wins:
                reconciled[field] = det_pick
                if field == "experience":
                    for ek in ("experience_text", "experience_min_years", "experience_max_years"):
                        if det_item.get(ek) is not None:
                            reconciled[ek] = det_item.get(ek)
                elif field == "budget":
                    for bk in ["budget_text", "yearly_budget", "yearly_budget_min", "yearly_budget_max", "monthly_budget", "monthly_budget_min", "monthly_budget_max", "budget_currency"]:
                        reconciled[bk] = det_item.get(bk)
                elif field == "work_mode" and det_item.get("work_mode_text"):
                    reconciled["work_mode_text"] = det_item.get("work_mode_text")
            else:
                reconciled[field] = _no_headings(ai_val)

            quote = det_quotes.get(field) or _find_verbatim_quote(str(ai_val), clean_block) or _find_verbatim_quote(str(det_val), clean_block)
            if quote:
                evidence_quotes[field] = quote

            review_required = True
            review_reasons.append(f"field_conflict_{field}")
            review_candidates[field] = {
                "ai_candidate": ai_val,
                "deterministic_candidate": det_val,
            }
            recovered_by[field] = "reconciled_conflict_preserved"

        # Case 4: Both NULL -> check Recall Guard (V3)
        else:
            # Check if block contains label followed by real value
            labels = FIELD_LABEL_SYNONYMS.get(field, ())
            for lbl in labels:
                pat = rf"(?im)^\s*(?:[-*•]\s*)?{re.escape(lbl)}\s*[:=\-–—|]\s*([^\n\r]+)"
                m = re.search(pat, clean_block)
                if m:
                    cand = m.group(1).strip()
                    if cand and not is_placeholder(cand):
                        # V5: Ambiguous values (e.g. 'Hybrid/Remote') keep work_mode_text with work_mode NULL; not a miss, no review.
                        if field == "work_mode" and (reconciled.get("work_mode_text") or "/" in cand):
                            continue
                        # Block contains label followed by real value, but final is NULL!
                        reconciled["possible_miss"] = True
                        review_required = True
                        reason = f"possible_miss_{field}: '{cand[:40]}'"
                        review_reasons.append(reason)
                        review_candidates[field] = {"missed_candidate": cand}
                        break

    # Propagate budget fields if present in either item
    for bk in ["budget_text", "budget", "yearly_budget", "yearly_budget_min", "yearly_budget_max", "monthly_budget", "monthly_budget_min", "monthly_budget_max", "budget_currency"]:
        if reconciled.get(bk) is None:
            val_bk = ai_item.get(bk) if ai_item.get(bk) is not None else det_item.get(bk)
            if val_bk is not None:
                reconciled[bk] = val_bk
    for bk in ("budget", "budget_text"):
        val_str = str(reconciled.get(bk) or "")
        if val_str and (len(val_str) > (220 if _EXP_SEGMENT_RX.search(val_str) else 80) or "\n" in val_str or any(w in val_str.lower() for w in ("dear", "kindly", "hello", "hi ", "regards", "candidate", "partner"))):
            if reconciled.get("monthly_budget"):
                reconciled[bk] = f"{int(reconciled['monthly_budget']):,} / month"
            elif reconciled.get("yearly_budget"):
                reconciled[bk] = f"{reconciled['yearly_budget']} LPA"
            else:
                reconciled[bk] = None

    if not reconciled.get("budget_text") and reconciled.get("budget"):
        reconciled["budget_text"] = reconciled["budget"]
    if not reconciled.get("budget") and reconciled.get("budget_text"):
        reconciled["budget"] = reconciled["budget_text"]

    # Propagate experience subfields
    for ek in ["experience_text", "experience", "overall_experience", "experience_min_years", "experience_max_years"]:
        if reconciled.get(ek) is None:
            val_ek = ai_item.get(ek) if ai_item.get(ek) is not None else det_item.get(ek)
            if val_ek is not None:
                reconciled[ek] = val_ek

    # Propagate work mode text
    if reconciled.get("work_mode_text") is None:
        reconciled["work_mode_text"] = ai_item.get("work_mode_text") or det_item.get("work_mode_text") or reconciled.get("work_mode")

    # Clean skills from template leakage
    for sk in ("mandatory_skills", "skills"):
        if isinstance(reconciled.get(sk), list):
            reconciled[sk] = [
                s for s in reconciled[sk]
                if str(s).strip().lower() not in CANDIDATE_TEMPLATE_HEADINGS
                and not any(h in str(s).strip().lower() for h in (
                    "full name", "mail id", "mobile no", "resumes sent date", "qualification",
                    "rate card", "joiners required", "work location", "current organization",
                    "current location", "job location", "s/r num", "vendor name", "position title"
                ))
            ]
            reconciled[sk] = [s for s in reconciled[sk] if not is_junk_skill(s, reconciled.get("job_title"))]

    reconciled["recovered_by"] = recovered_by
    reconciled["review_candidates"] = review_candidates
    reconciled["field_evidence_quotes"] = evidence_quotes

    # Review routing (A1): only missing job title or failed critical check triggers pending review
    # Missing budget, notice period, skills, experience, location, work mode are valid NULLs
    if not reconciled.get("job_title"):
        review_required = True
        review_reasons.append("missing_job_title")

    return reconciled, review_required, review_reasons


def verify_stored_requirement(payload: dict[str, Any], block_text: str) -> tuple[str, list[str]]:
    """
    Post-Save Verifier (V4):
    Re-reads stored field values against stored source block.
    Returns status ("verified" | "failed") and failed fields list.
    """
    clean_block = strip_all_exclusion_zones(block_text).replace("\xa0", " ")  # non-breaking spaces break label matching
    failed_fields: list[str] = []

    fields_to_verify = [
        "job_title",
        "location",
        "experience",
        "budget",
        "notice_period",
        "work_mode",
    ]

    for field in fields_to_verify:
        val = payload.get(field)
        if val is None or is_placeholder(val):
            continue  # Valid NULL

        val_str = ", ".join(val) if isinstance(val, list) else str(val)
        quote = _find_verbatim_quote(val_str, clean_block)
        if not quote:
            # Check individual tokens if multiple words
            tokens = [t for t in re.split(r"[\s,;/|]+", val_str) if len(t) >= 3 and not is_placeholder(t)]
            matched_tokens = sum(1 for t in tokens if _find_verbatim_quote(t, clean_block))
            if tokens and (matched_tokens / len(tokens)) < 0.5:
                failed_fields.append(field)

    status = "failed" if failed_fields else "verified"
    return status, failed_fields
