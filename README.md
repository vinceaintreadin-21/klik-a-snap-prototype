markdown_content = """# Klik-a-Snap: AI-Powered ID Production System

**Klik-a-Snap** is a high-performance, automated ID production platform designed to streamline student data ingestion and ID card generation. Using computer vision and machine learning, the system automates the tedious task of face cropping, image enhancement, and template alignment.

---

## 🚀 Tech Stack

### **Frontend**
* **React 18 (TypeScript):** For a type-safe, component-based user interface.
* **Tailwind CSS:** For a modern, utility-first responsive design.
* **React-Draggable:** Powering the visual "What You See Is What You Get" (WYSIWYG) ID layout editor.
* **Context API:** Managing global state for Authentication and Order tracking.

### **Backend**
* **Django 5.0:** Robust Python framework for the core logic and API.
* **Django REST Framework (DRF):** Providing a secure, scalable RESTful API.
* **SimpleJWT:** Handling stateless authentication via JSON Web Tokens.
* **Threading & Background Tasks:** Processing heavy AI workloads without blocking the main server thread.

### **AI & Computer Vision**
* **OpenCV:** Handling image manipulation, background processing, and final rendering.
* **MediaPipe (Google AI):** Real-time face detection and precise coordinate mapping for automated cropping.
* **Pillow (PIL):** High-quality image compositing for the final ID print sheets.

---

## 🛠️ Core Functions

### 1. Client Portal (School Coordinator)
* **Bulk Ingestion:** Upload thousands of student records via a simple CSV file.
* **Real-time Tracking:** Monitor the production status (Pending, Processing, Completed) of each batch.
* **Student Self-Service:** Unique intake links for students to enter their data via a public form (Option B).

### 2. Operator Dashboard (Production Staff)
* **Visual Layout Architect:** A full-screen, drag-and-drop interface to define where the face, name, QR code, and barcode appear on the ID template.
* **AI Engine Control:** Trigger the MediaPipe-powered face cropping and alignment engine.
* **Fail-Safe Tools:** Search for students to display QR codes on mobile devices for "lost slips" and a "Quick Add" feature for walk-ins.

### 3. AI Production Engine
* **Auto-Crop & Align:** Automatically identifies faces in student photos and crops them to the exact aspect ratio required by the template.
* **QR-Photo Linking:** Uses OpenCV to scan QR codes within photos to automatically link images to student records.
* **Automated Sheet Imposition:** Stitches approved IDs onto A4/Long Bond paper layouts for physical printing.

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
│   └── core/               # Django Settings & WSGI
