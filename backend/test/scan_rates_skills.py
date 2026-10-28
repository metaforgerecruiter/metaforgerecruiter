import sys, os
from dotenv import load_dotenv

env_path = "f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/.env"
load_dotenv(env_path)

sys.path.append("f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/src/email_extraction")

from outlook_graph import _token_client_credentials, iter_inbox_messages
from config import Settings
import re

settings = Settings.from_env()
token = _token_client_credentials(settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret)
mailbox = settings.mailbox_upn

print("Scanning recent inbox messages...")
count = 0
for msg in iter_inbox_messages(token, mailbox, limit=20, orderby="receivedDateTime desc"):
    subject = msg.get("subject", "")
    body = msg.get("body", {}).get("content", "")
    clean = re.sub(r'<[^>]+>', ' ', body)
    clean = re.sub(r'\s+', ' ', clean)

    # Search for rate / budget / skills lines
    rate_matches = re.findall(r'(?:rate|budget|tpc|ctc|package|salary)[^.\n]{1,80}', clean, re.I)
    skills_matches = re.findall(r'(?:mandatory skills?|technical skills?|key skills?|required skills?|skills?:)[^.\n]{1,120}', clean, re.I)

    print(f"\n[{count+1}] Subject: {subject[:70]}")
    if rate_matches:
        print("   Rate/Budget matches:", rate_matches[:3])
    else:
        print("   Rate/Budget: None found")
    if skills_matches:
        print("   Skills matches:", skills_matches[:3])
    else:
        print("   Skills: None found")
    count += 1
