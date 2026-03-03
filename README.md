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

> **AI-Powered Creative Platform** — Unleash your creativity with intelligent tools, immersive design, and seamless project management.

creAItr. is a full-stack AI-powered creative platform that combines large language models with local retrieval-augmented generation (RAG) capabilities. It provides users with intelligent chat functionality, project management tools, and a comprehensive creative workspace featuring video editing, photo editing, canvas drawing, and rich text writing tools.

---

## ✨ Features

### 🤖 AI Chat System
- **Qwen 2.5 (72B)** powered conversations via NVIDIA API
- **RAG Integration** with ChromaDB for semantic search
- **Real-time streaming** responses with reasoning display
- **Text-to-Speech** with Edge-TTS integration
- Maintains conversation history and context awareness

### 📁 Project Management & Kanban
- **Project Workspaces**: Create, organize, and manage multiple projects
- **Kanban Board**: Full drag-and-drop task board with To Do, In Progress, and Done states
- **Progress Tracking**: Real-time progress bars and task completion stats for every project
- **Global Overview**: Unified board to manage all project milestones in one place

### 🛠️ Creative Tools
| Tool | Description |
|------|-------------|
| 💬 **AI Chat** | Integrated chat within projects |
| 🎬 **Video Editor** | Video editing with Cloudinary integration |
| 🖼️ **Photo Editor** | Image editing and manipulation tools |
| 🎨 **Canvas** | Drawing and sketching with Excalidraw |
| ✍️ **Writing Area** | Rich text editor with React Quill |
| 🔥 **Trend Spotter** | AI discovery tool for viral content ideas |

### 📚 Knowledge Base
- **RSS & NewsAPI** integration for real-time news ingestion
- **PDF Processing** for local document ingestion
- **Vector Storage** with ChromaDB for fast semantic search

### 📊 YouTube Analytics
- Channel statistics and growth metrics
- Historical data visualization
- Automated snapshot system

---

## 🎨 Design Philosophy

creAItr. embodies a **"Dark Future"** aesthetic combining cutting-edge AI with an immersive, cinematic experience:

- **Minimalist Complexity** — Clean interfaces hiding sophisticated functionality
- **Cinematic Immersion** — 3D backgrounds and smooth animations creating depth
- **Glass Morphism** — Modern translucent UI elements with blur effects
- **AI-First Experience** — Every interaction feels intelligent and responsive

---

## 🏗️ Architecture

```
creAItr.
├── frontend/                # React 19 + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   └── context/         # React Context providers
│   └── ...
├── backend_server/          # Flask Python backend
│   ├── backend.py           # Main server file
│   └── ...
└── my_local_db/             # ChromaDB vector storage
```

### Frontend Stack
- **React 19** with Vite for blazing fast development
- **TailwindCSS 4** for utility-first styling
- **Framer Motion** for smooth animations
- **Three.js + React Three Fiber** for 3D backgrounds
- **Excalidraw** for canvas functionality

### Backend Stack
- **Flask** micro web framework
- **MongoDB** for user data and projects
- **ChromaDB** for vector embeddings
- **NVIDIA API** with Qwen 2.5 model
- **Cloudinary** for media storage

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.8+
- **Node.js** 18+
- **MongoDB** 4.4+
- Memory: 4GB+ recommended

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/creaitr.git
cd creaitr
```

**2. Set up environment variables**

Create a `.env` file in the root directory:
```env
# AI Model Configuration
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
MODEL_NAME=nvidia/llama-3.1-nemotron-70b-instruct

# News APIs
NEWS_API_KEY=your_news_api_key
RSS_URL=your_rss_feed_url

# Database
MONGODB_URI=mongodb://localhost:27017
DB_PATH=./my_local_db

# Authentication
JWT_SECRET_KEY=your_jwt_secret

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# YouTube Analytics (Optional)
YOUTUBE_API_KEY=your_youtube_api_key

# Server
PORT=5000
```

**3. Install and run the Backend**
```bash
cd backend_server
pip install -r requirements.txt
python backend.py
```

**4. Install and run the Frontend**
```bash
cd frontend
npm install
npm run dev
```

**5. Open your browser**

Navigate to `http://localhost:5173` to access creAItr.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | User registration |
| `POST` | `/auth/login` | User login |
| `GET` | `/auth/verify` | Token verification |
| `GET` | `/auth/me` | Get current user profile |

### Chat System
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send message (streaming) |
| `POST` | `/update-news` | Refresh knowledge base |
| `POST` | `/tts` | Text-to-speech conversion |

### Projects & Kanban
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects` | Get user projects with task stats |
| `POST` | `/projects` | Create new project |
| `GET` | `/tasks` | Get all project tasks |
| `POST` | `/tasks` | Create new Kanban card |
| `PUT` | `/tasks/:id` | Update task status or order |

### Workspace Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/PUT` | `/projects/:id/workspace/canvas` | Canvas data |
| `GET/PUT` | `/projects/:id/workspace/writing` | Writing content |
| `GET/POST` | `/projects/:id/workspace/chat` | Chat history |
| `POST` | `/projects/:id/workspace/upload` | Upload media |

---

## 🔒 Security

- **JWT Token Authentication** — Secure API access
- **Bcrypt Password Hashing** — Industry-standard password security
- **CORS Protection** — Cross-origin request protection
- **User Data Isolation** — Project and data separation per user

---

## 🗺️ Roadmap

- [ ] Real-time collaboration on projects
- [ ] Advanced video editing capabilities
- [ ] AI-powered content generation
- [ ] Integration with more AI models
- [ ] Mobile application
- [ ] Team workspace functionality
- [ ] WebSocket integration for real-time updates
- [ ] Redis caching for improved performance

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

If you have any questions or run into issues, please open an issue on GitHub.

---

<p align="center">
  Made with ❤️ by the creAItr. team
</p>
