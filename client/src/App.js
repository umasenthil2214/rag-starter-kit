import React, { useState } from 'react';
import { Upload, MessageCircle, FileText, Settings, Bot } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'chat', name: 'Chat', icon: MessageCircle },
    { id: 'upload', name: 'Upload', icon: Upload },
    { id: 'documents', name: 'Documents', icon: FileText },
  ];

  const handleDocumentUploaded = (newDocument) => {
    setDocuments(prev => [...prev, newDocument]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                RAG Starter Kit
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Powered by OpenAI & Pinecone
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'chat' && (
            <ChatInterface />
          )}
          
          {activeTab === 'upload' && (
            <DocumentUpload 
              onDocumentUploaded={handleDocumentUploaded}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
          
          {activeTab === 'documents' && (
            <DocumentList 
              documents={documents}
              setDocuments={setDocuments}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Built with React, Node.js, OpenAI, and Pinecone
            </p>
            <p className="mt-1">
              A plug-and-play RAG (Retrieval-Augmented Generation) starter kit
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 