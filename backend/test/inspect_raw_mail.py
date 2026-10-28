import sys, os
from dotenv import load_dotenv

env_path = "f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/.env"
load_dotenv(env_path)

sys.path.append("f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/src/email_extraction")

from outlook_graph import _token_client_credentials, fetch_message_by_id
from config import Settings

settings = Settings.from_env()
token = _token_client_credentials(settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret)
msg_id = "AAMkADE3NDllMmZlLTU3NmUtNGI2MS1hZjA4LTEwNzAzZWZjYzUxOABGAAAAAABG8jimhHIeTrzzeDCLnQR9BwAIHnK_cnn0TIdFuplFGEzAAAAAAAEMAAAIHnK_cnn0TIdFuplFGEzAAACG6pQLAAA="

mailbox = settings.mailbox_upn
data = fetch_message_by_id(token, mailbox, msg_id)
if data:
    body = data.get("body", {}).get("content", "")
    import re
    clean = re.sub(r'<[^>]+>', ' ', body)
    clean = re.sub(r'\s+', ' ', clean)
    with open("f:/Recruiter-Appplication-V2/backend/test/raw_email_preview.txt", "w", encoding="utf-8") as f:
        f.write("Subject: " + str(data.get("subject")) + "\n")
        f.write("From: " + str(data.get("from")) + "\n")
        f.write("\n--- CLEAN TEXT ---\n")
        f.write(clean)
    print("Written to raw_email_preview.txt successfully.")
else:
    print("Message not found or fetch failed.")
