"""
Auto Email Extraction Package.

A modular AI-driven recruitment pipeline that ingests inbox messages via Microsoft Graph API,
cleans and normalizes email content, parses structured hiring requirements, deduplicates
against existing records, validates compliance, and persists into database/API storage.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure package directory and src directory are in sys.path
_pkg_dir = str(Path(__file__).resolve().parent)
_src_dir = str(Path(__file__).resolve().parent.parent)
if _pkg_dir not in sys.path:
    sys.path.insert(0, _pkg_dir)
if _src_dir not in sys.path:
    sys.path.insert(0, _src_dir)

from .config import Settings
from .models import RequirementItem, RequirementParseResult
from .processed_store import ProcessedStore
from .requirement_classifier import classify_email
from .requirement_parser import parse_requirements_from_email
from .client_detector import detect_client
from .metaforge_api import IdAllocator, send_to_metaforge

__all__ = [
    "Settings",
    "RequirementItem",
    "RequirementParseResult",
    "ProcessedStore",
    "classify_email",
    "parse_requirements_from_email",
    "detect_client",
    "IdAllocator",
    "send_to_metaforge",
]
