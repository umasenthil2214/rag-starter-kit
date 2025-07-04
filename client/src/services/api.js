import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Document API functions
export const documentAPI = {
  // Upload document
  upload: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get document list
  getList: async () => {
    const response = await api.get('/documents/list');
    return response.data;
  },

  // Delete document
  delete: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Get document statistics
  getStats: async () => {
    const response = await api.get('/documents/stats');
    return response.data;
  },
};

// Chat API functions
export const chatAPI = {
  // Send message
  sendMessage: async (message, conversationId, useStreaming = false) => {
    if (useStreaming) {
      // For streaming, we'll handle this differently
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          useStreaming: true,
        }),
      });
      return response;
    } else {
      const response = await api.post('/chat/send', {
        message,
        conversationId,
        useStreaming: false,
      });
      return response.data;
    }
  },

  // Create new conversation
  createConversation: async () => {
    const response = await api.post('/chat/conversation');
    return response.data;
  },

  // Get conversation history
  getHistory: async (conversationId) => {
    const response = await api.get(`/chat/history/${conversationId}`);
    return response.data;
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Search documents
  search: async (query, topK = 5) => {
    const response = await api.post('/chat/search', { query, topK });
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return `Bad Request: ${data.message || 'Invalid input'}`;
      case 401:
        return 'Unauthorized: Please check your API keys';
      case 403:
        return 'Forbidden: Access denied';
      case 404:
        return 'Not Found: Resource not available';
      case 413:
        return 'File too large: Please upload a smaller file';
      case 429:
        return 'Too many requests: Please wait a moment';
      case 500:
        return 'Server Error: Please try again later';
      default:
        return data.message || `Error ${status}: Something went wrong`;
    }
  } else if (error.request) {
    // Network error
    return 'Network Error: Please check your connection';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

// File validation utility
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF, DOCX, and TXT files are allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default api; 