import sys, os
from dotenv import load_dotenv

env_path = "f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/.env"
load_dotenv(env_path)

sys.path.append("f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/src/email_extraction")

from outlook_graph import _token_client_credentials, fetch_message_by_id
from config import Settings
from requirement_segmenter import segment_email_into_blocks

settings = Settings.from_env()
token = _token_client_credentials(settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret)
# Accenture message id from earlier
msg_id = "AAMkADE3NDllMmZlLTU3NmUtNGI2MS1hZjA4LTEwNzAzZWZjYzUxOABGAAAAAABG8jimhHIeTrzzeDCLnQR9BwAIHnK_cnn0TIdFuplFGEzAAAAAAAEMAAAIHnK_cnn0TIdFuplFGEzAAACFfXOpAAA="

mailbox = settings.mailbox_upn
data = fetch_message_by_id(token, mailbox, msg_id)
if data:
    html = data.get("body", {}).get("content", "")
    blocks = segment_email_into_blocks("", html=html)
    print("Total blocks segmented:", len(blocks))
    if blocks:
        for b in blocks[:3]:
            print("\nBlock index:", b.get("block_index"))
            print("table_row_fields:", b.get("table_row_fields"))
            print("block_text snippet:", b.get("block_text")[:150])
