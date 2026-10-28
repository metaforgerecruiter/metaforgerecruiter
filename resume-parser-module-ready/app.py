import os
import time
import requests
import subprocess
import streamlit as st
from typing import Dict, Any

# -----------------------------------------------------------------------------
# Page Configuration & Clean Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Resume Parser",
    page_icon="📄",
    layout="centered",
    initial_sidebar_state="collapsed",
)

st.markdown("""
<style>
    .candidate-card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        color: #f8fafc;
    }
    .candidate-name {
        font-size: 1.75rem;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 0.25rem;
    }
    .candidate-role {
        font-size: 1.1rem;
        color: #94a3b8;
        margin-bottom: 1rem;
    }
    .badge-ai {
        background: #059669;
        color: #ffffff;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .badge-fallback {
        background: #d97706;
        color: #ffffff;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .skill-tag {
        display: inline-block;
        background: #0284c7;
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.35rem 0.75rem;
        margin: 0.2rem;
        border-radius: 9999px;
    }
</style>
""", unsafe_allow_html=True)

DEFAULT_BACKEND_URL = os.getenv("RESUME_PARSER_URL", "http://localhost:3001")

def check_backend_health(base_url: str) -> Dict[str, Any]:
    try:
        resp = requests.get(f"{base_url}/health", timeout=2)
        if resp.status_code == 200:
            return {"online": True, **resp.json()}
        return {"online": False, "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"online": False, "error": str(e)}

def ensure_backend_running(base_url: str) -> Dict[str, Any]:
    health = check_backend_health(base_url)
    if not health.get("online"):
        module_dir = os.path.dirname(os.path.abspath(__file__))
        server_script = os.path.join(module_dir, "dist", "server.js")
        if os.path.exists(server_script):
            try:
                subprocess.Popen(
                    ["node", "dist/server.js"],
                    cwd=module_dir,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    shell=True
                )
                for _ in range(8):
                    time.sleep(0.5)
                    health = check_backend_health(base_url)
                    if health.get("online"):
                        break
            except Exception:
                pass
    return health

def parse_resume_api(base_url: str, file_bytes: bytes, filename: str) -> Dict[str, Any]:
    url = f"{base_url}/api/resume/parse"
    files = {"resume": (filename, file_bytes)}
    resp = requests.post(url, files=files, timeout=60)
    resp.raise_for_status()
    return resp.json()

# -----------------------------------------------------------------------------
# Application Header & Status Check
# -----------------------------------------------------------------------------
st.title("📄 Resume Parser")
st.caption("Extract structured candidate data from PDF, DOCX, DOC, or TXT resumes.")

health = ensure_backend_running(DEFAULT_BACKEND_URL)
if not health.get("online"):
    st.error(f"Resume parser backend is offline on {DEFAULT_BACKEND_URL}. Run `npm start` in this folder.")
    st.stop()

# -----------------------------------------------------------------------------
# File Upload Section
# -----------------------------------------------------------------------------
uploaded_file = st.file_uploader(
    "Choose a resume file",
    type=["pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"],
    help="Supports PDF, Word Documents (.docx, .doc), Plain Text (.txt), and scanned image files."
)

if uploaded_file is not None:
    file_bytes = uploaded_file.getvalue()
    filename = uploaded_file.name

    col_btn, col_info = st.columns([1, 2])
    with col_btn:
        parse_btn = st.button("🚀 Parse Resume", type="primary", use_container_width=True)
    with col_info:
        st.write(f"📁 **File:** `{filename}` ({round(len(file_bytes)/1024, 1)} KB)")

    if parse_btn:
        with st.spinner("Extracting candidate fields..."):
            try:
                result = parse_resume_api(DEFAULT_BACKEND_URL, file_bytes, filename)
                candidate = result.get("data", {})
                st.session_state["parsed_candidate"] = candidate
                st.session_state["parsed_filename"] = filename
            except Exception as e:
                st.error(f"Failed to parse resume: {e}")

# -----------------------------------------------------------------------------
# Display Extracted Results
# -----------------------------------------------------------------------------
if "parsed_candidate" in st.session_state:
    cand = st.session_state["parsed_candidate"]
    parser_used = cand.get("parser", "legacy")
    badge_class = "badge-ai" if parser_used == "metaforge" else "badge-fallback"
    badge_label = "Gemini AI" if parser_used == "metaforge" else "Local Fallback Parser"

    st.markdown("---")
    
    # Candidate Header
    name = cand.get("candidateName") or "Name Not Detected"
    role = cand.get("role") or cand.get("technologiesRaw") or "Role Not Specified"
    
    st.markdown(f"""
    <div class="candidate-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <div class="candidate-name">{name}</div>
                <div class="candidate-role">{role}</div>
            </div>
            <span class="{badge_class}">Engine: {badge_label}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 2-Column Field Breakdown
    c1, c2 = st.columns(2)
    with c1:
        st.markdown("**📧 Email:**")
        st.write(cand.get("email") or "Not found")

        st.markdown("**📞 Phone:**")
        st.write(cand.get("contactNumber") or "Not found")

        st.markdown("**📍 Location:**")
        st.write(cand.get("currentLocation") or cand.get("location") or "Not found")

        st.markdown("**🔗 LinkedIn:**")
        linkedin = cand.get("linkedinUrl")
        if linkedin:
            st.markdown(f"[{linkedin}]({linkedin})")
        else:
            st.write("Not found")

    with c2:
        st.markdown("**💼 Total Experience:**")
        st.write(cand.get("totalExperience") or "Not found")

        st.markdown("**🎓 Highest Qualification:**")
        st.write(cand.get("highestQualification") or "Not found")

        st.markdown("**🏢 Current Employer:**")
        st.write(cand.get("currentEmployer") or "Not specified")

        st.markdown("**📄 Source File:**")
        st.write(cand.get("sourceFile") or st.session_state.get("parsed_filename", "N/A"))

    # Skills Section (Chips)
    st.markdown("---")
    st.markdown("### 🛠️ Skills & Technologies")
    skills_raw = cand.get("skillsRaw")
    if skills_raw:
        skills_list = [s.strip() for s in skills_raw.split(",") if s.strip()]
        chips_html = "".join([f'<span class="skill-tag">{skill}</span>' for skill in skills_list])
        st.markdown(chips_html, unsafe_allow_html=True)
    else:
        st.info("No specific skills extracted from dedicated section.")

    # Expandable JSON View
    with st.expander("🔍 View Raw Parsed JSON"):
        st.json(cand)
