"""
The AI model is required for prose job descriptions. When it cannot be reached (daily quota used up,
key rejected, provider down), extraction must stop and the mail must wait, never fall back to a
degraded guess that would be saved as a requirement.
"""

from __future__ import annotations


class LLMUnavailable(RuntimeError):
    """The AI model cannot be used right now; the message should be retried later, not saved."""


_UNAVAILABLE_MARKERS = (
    "429",
    "quota",
    "resource_exhausted",
    "rate limit",
    "ratelimit",
    "401",
    "403",
    "permission_denied",
    "api key",
    "api_key",
    "503",
    "unavailable",
    "timed out",
    "timeout",
    "connection",
)


def is_unavailable_error(exc: BaseException | None) -> bool:
    if exc is None:
        return False
    msg = f"{type(exc).__name__} {exc}".lower()
    return any(m in msg for m in _UNAVAILABLE_MARKERS)


def is_quota_exhausted(exc: BaseException | None) -> bool:
    """A used-up quota will not recover within seconds, so retrying in a loop only wastes time."""
    if exc is None:
        return False
    msg = str(exc).lower()
    return "quota" in msg or "resource_exhausted" in msg
