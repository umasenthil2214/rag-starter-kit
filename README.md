# RAG Starter Kit

A plug-and-play Retrieval-Augmented Generation (RAG) application built with Node.js, React, Pinecone, and OpenAI.

## 🚀 Features

- **Document Upload & Processing**: Support for PDF, TXT, DOCX files
- **Vector Database**: Pinecone integration for efficient similarity search
- **AI-Powered Chat**: OpenAI GPT integration with context-aware responses
- **Modern UI**: React frontend with Tailwind CSS
- **Real-time Streaming**: Live response generation
- **Conversation History**: Persistent chat sessions
- **Document Management**: Upload, view, and delete documents
- **Metadata Filtering**: Filter by document type and source

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Pinecone SDK
- **Frontend**: React, Tailwind CSS, Axios
- **AI**: OpenAI GPT-4/3.5-turbo
- **Vector Database**: Pinecone
- **File Processing**: Multer, PDF-parse, mammoth

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Pinecone account and API key
- OpenAI API key

## ⚡ Quick Start

1. **Clone and Setup**
   ```bash
   git clone <your-repo-url>
   cd rag-starter-kit
   npm run setup
   ```

2. **Environment Configuration**
   ```bash
   cp server/env.example server/.env
   ```
   
   Edit `server/.env` with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=rag-starter-kit
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📁 Project Structure

```
rag-starter-kit/
├── server/                 # Node.js backend
│   ├── controllers/        # API route handlers
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API calls
│   │   └── utils/         # Frontend utilities
│   └── public/            # Static assets
├── uploads/               # Document storage
└── package.json           # Root package.json
```

## 🔧 Configuration

### Pinecone Setup
1. Create a Pinecone account at https://www.pinecone.io/
2. Create a new index with:
   - Dimensions: 1536 (for OpenAI embeddings)
   - Metric: cosine
   - Pod type: starter (free tier)

### OpenAI Setup
1. Get your API key from https://platform.openai.com/
2. Ensure you have credits for API usage

## 📖 Usage

1. **Upload Documents**: Drag and drop or select files to upload
2. **Process Documents**: Wait for documents to be processed and indexed
3. **Start Chatting**: Ask questions about your documents
4. **View History**: Access previous conversations
5. **Manage Documents**: View, search, or delete uploaded documents

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_ENVIRONMENT` | Pinecone environment | Yes |
| `PINECONE_INDEX_NAME` | Pinecone index name | Yes |
| `PORT` | Server port (default: 5001) | No |
| `NODE_ENV` | Environment (development/production) | No |

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
cd server
npm start
```

### Docker Deployment
```bash
docker build -t rag-starter-kit .
docker run -p 3000:3000 -p 5001:5001 rag-starter-kit
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Create an issue for bugs or feature requests
- Check the documentation in the `/docs` folder
- Review the example configurations

## 🔄 Updates

Stay updated with the latest features and improvements by checking the releases page. 