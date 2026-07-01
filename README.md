<div align="center">

# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Camera%20with%20Flash.png" alt="Camera" width="50" /> `Klik-a-Snap`

### **The Ultimate AI-Powered ID Production System**

![Production Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![AI-Powered](https://img.shields.io/badge/AI-MediaPipe-orange?style=for-the-badge)

*Streamlining student data ingestion and automated card generation with surgical precision.*

---

</div>

## 🚀 Tech Stack

### **Frontend**

| Tool | Logo | Description |
| :--- | :---: | :--- |
| **React 18** | <img src="https://skillicons.dev/icons?i=react" width="40" /> | Type-safe, component-based UI using TypeScript. |
| **Tailwind CSS** | <img src="https://skillicons.dev/icons?i=tailwind" width="40" /> | Modern, utility-first responsive styling. |
| **State Management** | <img src="https://skillicons.dev/icons?i=ts" width="40" /> | Context API for Auth and Order tracking. |
| **React-Draggable** | 🖱️ | Visual "What You See Is What You Get" (WYSIWYG) editor. |

### **Backend**

| Tool | Logo | Description |
| :--- | :---: | :--- |
| **Django 5.0** | <img src="https://skillicons.dev/icons?i=django" width="40" /> | Robust Python framework for core business logic. |
| **DRF** | ⚙️ | Secure, scalable RESTful API architecture. |
| **SimpleJWT** | 🔐 | Stateless authentication via JSON Web Tokens. |
| **Threading** | 🧵 | Asynchronous processing for heavy AI workloads. |

### **AI & Computer Vision**

| Tool | Logo | Description |
| :--- | :---: | :--- |
| **OpenCV** | <img src="https://skillicons.dev/icons?i=opencv" width="40" /> | Image manipulation and background processing. |
| **MediaPipe** | 🎯 | Real-time face detection and coordinate mapping. |
| **Pillow (PIL)** | 🖼️ | High-quality image compositing and print rendering. |

---

## 👥 System Roles

Klik-a-Snap is built around four cooperating roles, each with a dedicated dashboard and a distinct slice of the order lifecycle.

| Role | Access Point | Primary Responsibility |
| :--- | :--- | :--- |
| 🛡️ **Admin** (Klik-A-Snap Head) | Admin Console | System-wide oversight, account/institution management, audit & analytics |
| 🧑‍💻 **Operator** (Klik-A-Snap Staff) | Operator Dashboard | Layout building, AI batch processing, manual review, print export |
| 🏫 **Institution** (Client Head) | Institution Portal | Order submission, proofing, batch approval |
| 📱 **Coordinator** (Client Staff) | Coordinator Mobile Dashboard | On-site photo day support, student lookup, walk-in registration |

### Order Lifecycle at a Glance

```
Submitted → IS Checker Validation → Layout Configured → AI Pipeline → Manual Review
   → Ready for Institution Proofing → Institution Approval (gate) → PRINTING → COMPLETED
```

---

## 🛡️ 1. Admin Process Flow — Klik-A-Snap Head

#### Account & Operator Management
- Create operator accounts and assign credentials
- Deactivate or reassign operators as needed
- Reset operator passwords when required

#### Institution Management
- Register new institutions into the system
- Suspend institutions when necessary
- View all orders tied to each institution

#### Order Oversight
- View all orders system-wide using status filters
- Assign or reassign operators to specific orders
- Manually override any order status (all overrides are logged to the audit trail)

#### Monitoring & Logs
- View processing logs and error reports
- Review the override audit log — includes who overrode, what status was changed, reason given, and timestamp
- Monitor manual review rates and flag systemic issues

#### System Analytics
- Track total IDs produced
- Monitor orders per month
- Review average turnaround time per order
- Analyze manual review rates across the system

#### Quality & Compliance
- Ensure operators configure layouts before triggering pipelines
- Verify institution approvals are recorded before printing is authorized
- Use audit logs to investigate disputes or errors

---

## 🧑‍💻 2. Operator Process Flow — Klik-A-Snap Staff

#### Order Management
- View all orders assigned to them
- Monitor the status of each assigned order

#### Layout Configuration *(must be completed before processing)*
- Open the ID Layout Builder for the assigned order
- Upload the institution's background/ID design image
- Drag and drop placeholders onto the canvas (Photo Box, Full Name, Student ID, etc.)
- Configure each placeholder — font size, color, alignment, visibility
- Preview the layout using a dummy student record in real time
- Save the layout as a `fields_config` JSON — this unlocks the AI pipeline for the order
- Edit or copy layout from a previous order if needed

#### Batch Photo Upload
- Upload a folder of batch photos (~500 photos per batch)
- Trigger the AI processing pipeline (only available after layout is saved)

#### Monitoring & Progress Tracking
- Monitor real-time processing progress via WebSocket
- Track how many photos have been processed, flagged, or failed

#### Manual Review
- Access the manual review queue for unmatched or unreadable QR photos
- Search for the student manually, or filter for students needing manual review and link the photo to the correct record

#### Order Progression
- Mark order as **Ready for Institution Proofing** once all IDs are reviewed
- Wait for institution approval before proceeding
- Mark order as **PRINTING** only after institution approval is recorded *(system-enforced)*
- Mark order as **COMPLETED** after printing is done

#### Export & Output
- Download final print-ready output files after printing is approved
- Export as a ZIP of print-ready PNGs or a PDF print sheet

---

## 🏫 3. Institution Process Flow — Client Head

#### Account Access
- Log in to the Institution/Client Portal
- View all existing orders and their current statuses
- View complete order history

#### Submitting a New Order *(with IS Checker)*
- Submit a new order with: institution name, batch name, and subject list (via CSV, Excel, or manual entry)
- The system validates data entry via the **IS Checker** — entries with errors are routed to manual proofing

#### After Student List Upload *(immediately available)*
- QR codes and barcodes are automatically generated per student upon upload
- Download QR code sheets per student for use during pictorial/photo day
- Share QR codes with school coordinators for photo day preparation

#### Coordinator Access Management
- Generate a unique coordinator access link from the institution portal (multiple coordinators supported)
- Share the generated link with the designated school coordinator personnel
- Coordinators use the link to access the Coordinator Mobile Dashboard tied to the institution's active order
- Institution can regenerate a new link if needed (e.g., change of personnel)

#### Order Monitoring
- Track the status of all submitted orders
- Monitor progress as the operator processes the batch

#### Proofing Stage
- View all generated ID proofs per student once processing is complete
- Review each student's ID individually
- Approve or request a revision per student ID

#### Batch Approval
- Approve the entire batch to move to **PRINTING** status
- This approval is recorded by the system and is required before the operator can proceed to printing *(system-enforced gate)*

#### Post-Approval
- Monitor the order as it progresses to **PRINTING** and **COMPLETED**
- View the finalized order in order history once completed

---

## 📱 4. Coordinator Process Flow — Client Staff

#### Account Access
- Receive the unique coordinator access link from the institution
- Open the link to access the Coordinator Mobile Dashboard
- Dashboard is automatically tied to the institution's active order — no manual login or setup required

#### Student Lookup
- Search for a student by name
- Display the student's QR code on screen for immediate use during photo day **(Fail-Safe A)**

#### Student List Monitoring
- View the complete list of all students in the batch
- Monitor each student's photo status in real time

#### Photo Day Management
- Mark individual students as photographed after their photo is taken
- Photo status is visible to the operator on their dashboard as a progress indicator

#### Walk-in / Late Student Handling
- Use **Quick Add** to register a walk-in student on the spot
- A QR code is instantly generated for the new student
- The new student is automatically added to the batch and propagated to the operator's order in real time **(Fail-Safe C)**

---

## 🔒 System-Enforced Gates & Fail-Safes

| Type | Name | Behavior |
| :--- | :--- | :--- |
| Gate | Layout-before-pipeline | The AI processing pipeline cannot be triggered until the operator saves a `fields_config` layout |
| Gate | Approval-before-print | An order cannot move to `PRINTING` until institution batch approval is recorded |
| Fail-Safe A | On-demand QR display | Coordinator can pull up any student's QR code on the spot if a printed sheet is lost or misread |
| Fail-Safe C | Real-time walk-in sync | New walk-in students added via Quick Add propagate instantly to the operator's order, no re-upload needed |
| Audit | Status override logging | Every admin override of an order status is logged with who, what changed, reason, and timestamp |

---

## 🤖 AI Production Engine

- **Auto-Crop & Align:** Automatically identifies and crops faces to the exact aspect ratio using MediaPipe.
- **QR-Photo Linking:** Uses OpenCV to scan QR codes within photos to link images to student records.
- **Automated Sheet Imposition:** Stitches IDs onto A4/Long Bond layouts for physical printing.
- **Manual Review Fallback:** Unmatched or unreadable QR photos are routed to the operator's manual review queue instead of failing silently.

---

## 📁 System Architecture

```text
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (Modals, Draggables)
│   │   ├── context/        # Auth & Order State Management
│   │   ├── pages/          # Dashboard, Login, Layout Studio
│   │   └── utils/          # API Axios instance & interceptors
├── backend/
│   ├── api/                # DRF Views, Serializers, & Routes
│   ├── services/           # AI Engine & Processing Logic
│   ├── media/              # Uploaded Templates & Processed IDs
│   └── core/                # Django Settings & WSGI
```

## ⚙️ Installation & Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
