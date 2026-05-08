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

## 🛠️ Core Functions

### 1. Client Portal (School Coordinator)
*   **Bulk Ingestion:** Upload thousands of student records via a simple CSV file.
*   **Real-time Tracking:** Monitor production status (Pending, Processing, Completed).
*   **Student Self-Service:** Unique intake links for students to enter data via public forms.

### 2. Operator Dashboard (Production Staff)
*   **Visual Layout Architect:** Full-screen drag-and-drop interface for template design.
*   **AI Engine Control:** Trigger MediaPipe-powered face cropping and alignment.
*   **Fail-Safe Tools:** Search for students to display QR codes or "Quick Add" walk-ins.

### 3. AI Production Engine
*   **Auto-Crop & Align:** Automatically identifies and crops faces to the exact aspect ratio.
*   **QR-Photo Linking:** Uses OpenCV to scan QR codes within photos to link images to records.
*   **Automated Sheet Imposition:** Stitches IDs onto A4/Long Bond layouts for physical printing.

---

## 📁 System Architecture
```text
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (Modals, Draggables)
│   │   ├── context/        # Auth & Order State Management
│   │   ├── pages/          # Dashboard, Login, Layout Studio
│   │   └── utils/          # API Axios instance & interceptors
├── backend/
│   ├── api/                # DRF Views, Serializers, & Routes
│   ├── services/           # AI Engine & Processing Logic
│   ├── media/              # Uploaded Templates & Processed IDs
│   └── core/               # Django Settings & WSGI
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
