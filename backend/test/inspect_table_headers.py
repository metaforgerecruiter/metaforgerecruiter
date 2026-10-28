import sys, os
from dotenv import load_dotenv
from bs4 import BeautifulSoup

env_path = "f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/.env"
load_dotenv(env_path)

sys.path.append("f:/Recruiter-Appplication-V2/Mail extraction/Auto_email_extraction/src/email_extraction")

from outlook_graph import _token_client_credentials, fetch_message_by_id
from config import Settings
from requirement_segmenter import match_table_header

settings = Settings.from_env()
token = _token_client_credentials(settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret)
msg_id = "AAMkADE3NDllMmZlLTU3NmUtNGI2MS1hZjA4LTEwNzAzZWZjYzUxOABGAAAAAABG8jimhHIeTrzzeDCLnQR9BwAIHnK_cnn0TIdFuplFGEzAAAAAAAEMAAAIHnK_cnn0TIdFuplFGEzAAACFfXOpAAA="

mailbox = settings.mailbox_upn
data = fetch_message_by_id(token, mailbox, msg_id)
if data:
    html = data.get("body", {}).get("content", "")
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    for tidx, table in enumerate(tables):
        trs = table.find_all("tr")
        if trs:
            headers = [th.get_text(" ", strip=True) for th in trs[0].find_all(["th", "td"])]
            print(f"Table {tidx} headers:")
            for hidx, h in enumerate(headers):
                canon = match_table_header(h)
                print(f"  Col {hidx}: '{h}' -> matched: '{canon}'")
