# CivicResolve — AI-Powered Citizen Grievance Management & Resolution

Built for **PromptWars × GDG on-Campus PSG iTech**, **CivicResolve** is an end-to-end AI-powered civic issue reporting, intelligent triage, and municipal resolution platform powered by **Google Gemini**.

## Problem Statement Alignment
Everyday civic issues—such as potholes, overflowing garbage bins, damaged streetlights, water pipeline leakage, and hazardous roads—frequently go unresolved because citizens do not know which municipal department to contact, while authorities struggle to manually sort and prioritize incoming complaints.

**CivicResolve** bridges citizens and municipal teams through an automated AI-first workflow:
`Citizen Complaint + Photo` → `Gemini AI Classification & Impact Scoring` → `Department Routing` → `Public Tracking` → `Admin Resolution`

## Key Features
- **Citizen Issue Reporting Portal:** Submit civic complaints with title, description, location (with optional browser GPS capture), category (or AI auto-detect), optional photo evidence, and 1-click sample test scenarios.
- **Google Gemini AI Classification:** Integrates directly with the **Google Gemini API (`gemini-2.5-flash`)** supporting both text and image analysis to accurately identify civic issue categories. Includes a built-in zero-friction Smart AI Triage Engine fallback so evaluators can test every workflow immediately without configuring an API key.
- **Priority Detection & Impact Scoring:** Evaluates safety hazards, public exposure, and infrastructure severity to assign priority (`Critical`, `High`, `Medium`, `Low`), a 0–100 Public Impact Score, and a target SLA response window.
- **Automated Department Recommendation:** Maps every complaint to the exact municipal body (Public Works & Roads, Solid Waste & Sanitation, Electrical & Streetlighting, Water Supply & Drainage, Traffic & Public Safety, Parks & Urban Horticulture) along with a recommended first field action.
- **Public Issue Tracking Dashboard:** Transparent live dashboard displaying Ticket IDs, real-time KPIs, 3-step visual resolution timelines (`Reported` → `In Progress` → `Resolved`), search/filtering, official updates, and community impact upvotes.
- **Municipal Admin Console:** Dedicated authority view featuring priority-sorted triage queues, departmental workload analytics, instant status/priority updates, official crew notes, and CSV report export.

## Tech Stack
- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (zero-bloat, fast load, responsive)
- **AI Engine:** Google Gemini 2.5 Flash REST API (multimodal text + image) with built-in deterministic NLP triage fallback
- **Persistence:** Browser `localStorage` for instant client-side state & demo persistence; `sessionStorage` for optional user-supplied Gemini API key

## Running Locally
Simply open `index.html` in any modern web browser—no build step or dependencies required.
