import React, { useState } from 'react';
import { Upload, MessageCircle, FileText, Settings, Bot, Menu, X } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'chat', name: 'Chat', icon: MessageCircle },
    { id: 'upload', name: 'Upload', icon: Upload },
    { id: 'documents', name: 'Documents', icon: FileText },
  ];

  const handleDocumentUploaded = (newDocument) => {
    setDocuments(prev => [...prev, newDocument]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`sidebar fixed top-0 left-0 h-full z-30 w-64 bg-gray-50 border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:block`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="notion-title text-lg">RAG Assistant</h1>
              <p className="text-xs text-gray-500">AI-powered document chat</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`notion-nav-item w-full ${
                    activeTab === tab.id ? 'active' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-8">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Powered by OpenAI & Pinecone</p>
              <p>RAG Starter Kit</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden notion-header fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Bot className="h-6 w-6 text-gray-900" />
          <h1 className="notion-title text-lg">RAG Assistant</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300 pt-16 lg:pt-0">
        <main className="p-6 lg:p-8">
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
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App; 