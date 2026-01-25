# creAItr. - AI-Powered Creative Platform

## Project Overview

creAItr. is a full-stack AI-powered creative platform that combines large language models with local retrieval-augmented generation (RAG) capabilities. The platform provides users with intelligent chat functionality, project management tools, and creative workspace features including video editing, photo editing, canvas drawing, and writing tools.

## Architecture

### Frontend
- **Framework**: React 19.2.0 with Vite
- **Styling**: Tailwind CSS 4.1.18
- **UI Components**: Custom components with Framer Motion animations
- **Routing**: React Router DOM 7.12.0
- **State Management**: React Context API for authentication

### Backend
- **Framework**: Flask (Python)
- **Database**: MongoDB for user data and projects, ChromaDB for vector storage
- **AI Integration**: NVIDIA API with Qwen 2.5 model
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Storage**: Cloudinary for media uploads

## Core Features

### 1. Authentication System
- User registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Social account integration support
- Protected routes and API endpoints

### 2. AI Chat System
- **Model**: Qwen 2.5 (72B parameters) via NVIDIA API
- **RAG Integration**: ChromaDB for semantic search
- **Streaming Responses**: Real-time message streaming
- **Context Awareness**: Maintains conversation history
- **Reasoning Display**: Shows AI thinking process
- **Text-to-Speech**: Edge-TTS integration for audio playback

### 3. Project Management
- Create, read, update, delete projects
- Project-specific workspaces
- Persistent data storage per project
- User-owned project isolation

### 4. Creative Tools
- **AI Chat**: Integrated chat within projects
- **Video Editor**: Video editing capabilities with Cloudinary integration
- **Photo Editor**: Image editing tools
- **Canvas**: Drawing and sketching interface using Excalidraw
- **Writing Area**: Rich text editor with React Quill

### 5. Knowledge Base Management
- **News Ingestion**: RSS feeds and NewsAPI integration
- **PDF Processing**: Local PDF document ingestion
- **Vector Storage**: ChromaDB for semantic search
- **Real-time Updates**: Manual knowledge base refresh

### 6. YouTube Analytics (Optional Feature)
- Channel statistics tracking
- Growth metrics calculation
- Historical data visualization
- Automated snapshot system

## Technical Requirements

### Frontend Dependencies
```json
{
  "@excalidraw/excalidraw": "^0.18.0",
  "@react-three/fiber": "^9.5.0",
  "@tabler/icons-react": "^3.36.1",
  "@tailwindcss/vite": "^4.1.18",
  "clsx": "^2.1.1",
  "lucide-react": "^0.562.0",
  "motion": "^12.29.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-markdown": "^10.1.0",
  "react-player": "^3.4.0",
  "react-quill": "^2.0.0",
  "react-router-dom": "^7.12.0",
  "tailwind-merge": "^3.4.0",
  "three": "^0.182.0"
}
```

### Backend Dependencies
```
flask
flask-cors
feedparser
chromadb
openai
python-dotenv
requests
pypdf
edge-tts
pymongo
cloudinary
bcrypt
PyJWT
google-api-python-client
matplotlib
pandas
numpy
```

## Environment Configuration

### Required Environment Variables
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

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# YouTube Analytics (Optional)
YOUTUBE_API_KEY=your_youtube_api_key

# Server
PORT=5000
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/verify` - Token verification
- `GET /auth/me` - Get current user profile

### Chat System
- `POST /chat` - Send message and get AI response (streaming)
- `POST /update-news` - Refresh knowledge base
- `POST /tts` - Text-to-speech conversion

### Project Management
- `GET /projects` - Get user projects
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Workspace Tools
- `GET/PUT /projects/:id/workspace/canvas` - Canvas data
- `GET/PUT /projects/:id/workspace/writing` - Writing content
- `GET /projects/:id/workspace/chat` - Chat history
- `POST /projects/:id/workspace/chat` - Add chat message
- `POST /projects/:id/workspace/upload` - Upload media
- `GET /projects/:id/workspace/media` - Get project media

### Standalone Chat Sessions
- `GET /chats` - Get chat sessions
- `POST /chats` - Create chat session
- `GET /chats/:id` - Get specific chat
- `POST /chats/:id/message` - Add message to chat
- `DELETE /chats/:id` - Delete chat session
- `PATCH /chats/:id` - Rename chat session

### YouTube Analytics (Optional)
- `GET/POST /stats/youtube/channel` - Channel configuration
- `GET /stats/youtube/realtime` - Real-time statistics
- `GET /stats/youtube/growth` - Growth metrics
- `GET /stats/youtube/graph` - Growth visualization
- `GET /stats/youtube/history` - Historical data

## Security Features

### Authentication & Authorization
- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes with token verification
- User-specific data isolation

### Data Protection
- Environment variable configuration
- CORS protection
- Input validation and sanitization
- Secure file upload handling

## Performance Optimizations

### Frontend
- Code splitting with React lazy loading
- Optimized bundle size with Vite
- Efficient re-rendering with React Context
- Smooth animations with Framer Motion

### Backend
- Streaming responses for real-time chat
- Vector database for fast semantic search
- Efficient MongoDB queries with indexing
- Cloudinary CDN for media delivery

## Deployment Requirements

### System Requirements
- **Python**: 3.8+
- **Node.js**: 18+
- **MongoDB**: 4.4+
- **Storage**: Minimum 2GB for vector database
- **Memory**: 4GB+ recommended for optimal performance

### Infrastructure
- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend**: Python-compatible hosting (Railway, Heroku, AWS)
- **Database**: MongoDB Atlas or self-hosted MongoDB
- **File Storage**: Cloudinary account
- **AI API**: NVIDIA API access

## Development Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend_server
pip install -r requirements.txt
python backend.py
```

## Future Enhancements

### Planned Features
- Real-time collaboration on projects
- Advanced video editing capabilities
- AI-powered content generation
- Integration with more AI models
- Mobile application
- Advanced analytics dashboard
- Team workspace functionality

### Technical Improvements
- WebSocket integration for real-time updates
- Redis caching for improved performance
- Microservices architecture
- Advanced security features
- API rate limiting
- Comprehensive testing suite

## License & Usage

This project is designed as a comprehensive AI-powered creative platform suitable for individual creators, small teams, and educational purposes. The modular architecture allows for easy customization and extension of features based on specific use cases.