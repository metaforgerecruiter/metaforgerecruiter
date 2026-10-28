# METAFORGE IT SOLUTIONS
## MetaForge Recruiter Application Platform (MRAP)
### Business Requirements Document (BRD) - Version 3.1
**Document Title:** MRAP Business Requirements Document (Post-Implementation Baseline Updates)  
**Document ID:** MRAP-BRD-2026-003.1  
**Date:** September 2026  
**Status:** Approved & Implemented Baseline  
**Supersedes:** MRAP-BRD-2026-003 (v3.0)  

---

## 1. Document Purpose & Revision Notice
This document updates the official **Business Requirements Document (BRD v3.0)** for the MetaForge Recruiter Application Platform (MRAP) to capture all functional, structural, and workflow enhancements implemented in the production codebase (`Recruiter-Application-Ver-3`).

All requirements, workflow modifications, and interface updates detailed below reflect the finalized operational software state across the four platform tiers: **Super Admin**, **Admin**, **Team Lead**, and **Recruiter**.

---

## 2. Summary of Post-BRD Modifications & Workflow Enhancements

### 2.1 Reports & Analytics Module (Super Admin, Admin & Team Lead)
* **Super Admin & Admin Reports Table Enhancement (`ReportsPage.tsx`)**:
  * **Header Revision:** Replaced column header `RECRUITER NAME & ROLE` with **`RECRUITER NAME & TEAM LEAD`**.
  * **Team Lead Identification:** Displays the Recruiter's Full Name on the top line and their assigned **Team Lead's Full Name** directly on the bottom line of the table cell (replacing email address display).
  * **Submissions Metric Column:** Included total candidate **Submissions Count** per recruiter alongside existing conversion rate metrics.
* **Team Lead Module Reports Rearrangement (`ReportsPage.tsx`)**:
  * **Toggle Reordering:** Rearranged performance metric view controls to place **`Self Performance`** first (front/left) and **`Team Performance`** second (next/right).
  * **Scoped Performance Views:**
    * `Self Performance`: Isolates individual Team Lead performance indicators (assigned requirements, candidate submissions, interviews, and placements).
    * `Team Performance`: Renders aggregated metrics for all recruiters supervised by the active Team Lead.

---

### 2.2 Total Submissions Management Module (Team Lead Scope)
* **Interactive View Scope Toggle (`SubmissionsPage.tsx`)**:
  * Added dynamic scope filter toggle buttons for Team Leads: **`My Submissions`**, **`Team Submissions`**, and **`All Submissions`**.
  * **Functionality:** Allows Team Leads to toggle seamlessly between their individual candidate submissions and candidate submissions submitted by their team members without changing underlying table columns or data structures.

---

### 2.3 Candidate Submission & Client Forwarding Workflow
* **Terminology & Workflow Realignment (`SubmitToLeadPage.tsx`)**:
  * **Action Renaming:** Updated submission controls across the interface from "Submit to Lead" and "Forward" to **"Forward to Client"** / **"Submit to Client"**.
  * **Removal of Lead Forwarding Box:** Removed the redundant "Submit to Lead" forwarding selection box for Team Lead module users, as Team Leads interact directly with enterprise clients.
  * **Default Submission Destination:** Configured **"Forward to client loop"** as the mandatory default submission destination for Team Lead candidate processing.
  * **Banner Clean-up:** Removed top-level "Submit to Lead" banner and single-action buttons to streamline the client delivery pipeline.

---

### 2.4 Candidate Repository Module (Team Lead View)
* **Submission Action Cleanup (`CandidateRepositoryPage.tsx`)**:
  * Removed individual per-row "Submit" action buttons from the candidate repository table for Team Lead role users.
  * Restricted candidate submission triggers in Team Lead view to batch/bulk selection or recruiter-initiated workflows.

---

### 2.5 Interview Tracking Module Scope (Recruiter vs Team Lead)
* **Recruiter Interview Tracking (`InterviewTrackingPage.tsx`)**:
  * Scoped the Recruiter Interview Tracking page strictly to interviews scheduled for candidates submitted individually by that specific recruiter.
* **Team Lead Interview Tracking (`InterviewTrackingPage.tsx`)**:
  * Added view filter controls (**`My Candidates`**, **`Team Candidates`**, **`All`**) enabling Team Leads to monitor both their individual candidate interviews and in-progress interviews scheduled by their team members.

---

### 2.6 Client Delivery Gap Analysis Module
* **Dynamic Gap Filtering (`ClientDeliveryGapAnalysisPage.tsx`)**:
  * Removed the static "Coverage" card section.
  * Introduced interactive multi-view toggle filters (**`All`**, **`Under-Submitted`**, **`Zero-Submitted`**, **`Fully-Covered`**) for dynamic requirement gap evaluation.

---

### 2.7 User & Access Management (RBAC & Audit Governance)
* **Enforced Role Boundaries (`UserManagementPage.tsx`, `ActivityLogsPage.tsx`, `navigation.ts`)**:
  * Maintained strict server-side and client-side data isolation across Super Admin, Admin, Team Lead, and Recruiter user tiers.
  * Updated navigation configuration and activity log tracking to record all candidate state transitions, client forwarding actions, and user management events.

---

## 3. Requirement Traceability Matrix (Post-BRD Updates)

| Requirement ID | Original BRD v3.0 Specification | Post-BRD Implementation Update (v3.1) | Component Affected | Status |
|---|---|---|---|---|
| **FR-12.1** | Reports display recruiter name & role | Header renamed to `RECRUITER NAME & TEAM LEAD`; bottom cell shows assigned Team Lead name instead of email | `ReportsPage.tsx` | Implemented |
| **FR-12.2** | Team Lead reports display team metrics | Added toggle with `Self Performance` first and `Team Performance` next | `ReportsPage.tsx` | Implemented |
| **FR-3.12** | Submissions page displays fixed submission list | Added scope toggle (`My Submissions`, `Team Submissions`, `All Submissions`) for Team Leads | `SubmissionsPage.tsx` | Implemented |
| **FR-3.2** | Two-stage submission workflow: Recruiter -> Lead -> Client | Replaced "Submit to Lead" with "Forward to Client" in TL module; removed Lead forwarding box; default = Forward to Client | `SubmitToLeadPage.tsx` | Implemented |
| **FR-2.10** | Candidate repository row actions include Submit | Removed per-row Submit button for Team Lead users | `CandidateRepositoryPage.tsx` | Implemented |
| **FR-4.7** | Interview tracking list shows all team interviews | Recruiter view restricted to individual candidates; Team Lead view given toggle (`My Candidates` / `Team Candidates` / `All`) | `InterviewTrackingPage.tsx` | Implemented |
| **FR-8.6** | Gap analysis displays coverage card section | Removed static coverage card; added dynamic status toggles (`Under-Submitted`, `Zero-Submitted`, `Fully-Covered`) | `ClientDeliveryGapAnalysisPage.tsx` | Implemented |

---

## 4. Operational Sign-off
This document serves as the updated baseline specification for MRAP Version 3.1. All changes documented herein have been implemented, built, and verified clean in the production codebase.
