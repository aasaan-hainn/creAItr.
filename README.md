<p align="center">
  <img src="frontend/public/favicon.png" alt="creAItr. Logo" width="150" height="150" />
</p>

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=react,vite,js,html,css,tailwind,threejs" alt="Frontend Stack" />
    <br>
    <img src="https://skillicons.dev/icons?i=python,flask,mongodb,nodejs,npm" alt="Backend Stack" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
</p>

# 🎨 creAItr.

> **The Unified Intelligence Interface** — A high-fidelity creative platform merging advanced neural models with professional production tools.

creAItr. is a professional-grade creative ecosystem built for the "Dark Future" aesthetic. It leverages **creAItr AI's** advanced reasoning capabilities alongside a local **Retrieval-Augmented Generation (RAG)** pipeline to provide a deeply contextual workspace for writers, designers, and developers.

---

## ⚡ Core Systems

### 🧠 Neural Engine
- **creAItr AI Reasoning**: Integrated with high-speed inference engines for advanced reasoning with transparent reasoning steps.
- **Dynamic RAG**: Local ChromaDB vector store for semantic indexing of PDFs, RSS feeds, and chat history.
- **Trend Spotter**: Specialized AI agent for identifying viral content opportunities from global social signals.
- **Sonic Synthesis**: Edge-TTS integration for low-latency, neural-quality text-to-speech.

### 📁 Unified Management
- **Global Kanban**: Unified drag-and-drop board for managing tasks across all project workstreams.
- **Asset Vault**: Centralized repository for sharing media and documents across different creative tools.
- **Creative Calendar**: 3D-inspired scheduling interface for deadline and production management.
- **YouTube Intelligence**: Real-time channel analytics, growth projections, and performance snapshots.

### 🛠️ Creative Suite
| Tool | Core Technology | Capability |
|------|-----------------|------------|
| 💬 **Project Chat** | creAItr AI + ChromaDB | Context-aware AI assistance within workspaces |
| 🎬 **Cinematic Editor** | Cloudinary | Professional video processing and secure cloud storage |
| 🖼️ **Photo Editor** | Canvas API | Real-time image manipulation and filtering |
| 🎨 **Neural Canvas** | Excalidraw | Rapid prototyping, wireframing, and freehand sketching |
| ✍️ **Writing Studio** | React Quill | AI-assisted rich text editing with Markdown and word analysis |
| 📦 **Asset Vault** | Persistent Storage | Cross-tool asset management and sharing |

---

## 🎨 Design Philosophy: "Dark Future"

creAItr. implements a bespoke cinematic UI/UX:
- **Glass Morphism**: Translucent elements with heavy backdrop blurs (Tailwind 4).
- **Cinematic Motion**: High-performance animations using Motion v12.
- **Spatial Depth**: Three.js/React Three Fiber backgrounds for immersive interaction.
- **Non-Linear Navigation**: Animated `GooeyNav` transitions for seamless page switching.

---

## 🏗️ Technical Stack

### Frontend (Modern React 19)
- **Vite 7**: Ultra-fast build and development cycle.
- **TailwindCSS 4**: Advanced utility-first styling.
- **Three.js + R3F**: Immersive 3D environments.
- **Motion**: Production-ready animation library.
- **Excalidraw & React Quill**: Specialized workspace tools.

### Backend (Python Microservices)
- **Flask**: Lightweight, high-performance API routing.
- **MongoDB**: Flexible NoSQL storage for profiles and metadata.
- **ChromaDB**: Native vector storage for local RAG processing.
- **PyJWT & Bcrypt**: Enterprise-grade security and authentication.
- **creAItr AI Engine**: High-fidelity large language model inference.

---

## 🚀 Quick Deployment

### Requirements
- **Hardware**: 4GB+ RAM, GPU optional (inference is API-based).
- **Runtime**: Python 3.8+, Node.js 18+.
- **Data**: MongoDB instance.

### Installation
1. **Clone & Enter**
   ```bash
   git clone https://github.com/aasaan-hainn/creAItr..git
   cd creAItr.
   ```
2. **Backend Setup**
   ```bash
   cd backend_server
   pip install -r requirements.txt
   python backend.py
   ```
3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📡 API Architecture

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/chat` | Contextual stream from creAItr AI with reasoning |
| `POST` | `/tts` | Neural speech generation |
| `GET`  | `/projects` | Workspace metadata and cross-project stats |
| `PUT`  | `/tasks/:id` | Real-time Kanban state update |

---

## 🔒 Security & Privacy
- **Data Sovereignty**: Your local documents are indexed into **Local Vector Stores**, never sent to model training sets.
- **Secure Auth**: JWT-secured sessions with bcrypt salted hashing and multi-layered token validation.
- **Encrypted Pipelines**: AES-256 for data at rest and TLS for all API communications.

---

## 💬 Support & Documentation
Detailed guides, API documentation, and security whitepapers are available within the application:
1. Navigate to **Support**
2. Click **View Docs** to enter the immersive Documentation portal.

---

<p align="center">
  Built for the visionaries. Made by the creAItr. team.
</p>
