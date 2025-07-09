import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle, Loader, FileText, Cloud } from 'lucide-react';
import { documentAPI, validateFile, handleAPIError } from '../services/api';

const DocumentUpload = ({ onDocumentUploaded, isLoading, setIsLoading }) => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      setUploadStatus({
        type: 'error',
        message: validation.errors.join(', ')
      });
      return;
    }

    // Start upload process
    setIsLoading(true);
    setUploadStatus({
      type: 'info',
      message: 'Processing document...'
    });
    setUploadProgress(0);

    let progressInterval;

    try {
      // Simulate progress (in real app, you'd track actual progress)
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload document
      const result = await documentAPI.upload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${file.name}`
      });

      // Notify parent component
      if (onDocumentUploaded) {
        onDocumentUploaded(result.document);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus(null);
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setUploadProgress(0);
      setUploadStatus({
        type: 'error',
        message: handleAPIError(error)
      });
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, onDocumentUploaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const getStatusIcon = () => {
    switch (uploadStatus?.type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'info':
        return <Loader className="h-6 w-6 text-blue-500 animate-spin" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus?.type) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-600" />
          </div>
          <h2 className="notion-title mb-2">Upload Documents</h2>
          <p className="notion-text">
            Upload PDF, DOCX, or TXT files to add them to your knowledge base
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-gray-400 bg-gray-50'
              : isDragReject
              ? 'border-red-400 bg-red-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <div className="text-center">
              {isDragActive ? (
                <p className="notion-subtitle text-gray-700">
                  Drop the file here...
                </p>
              ) : isDragReject ? (
                <p className="notion-subtitle text-red-600">
                  File type not supported
                </p>
              ) : (
                <>
                  <p className="notion-subtitle text-gray-700 mb-2">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="notion-text text-sm">
                    Supports PDF, DOCX, and TXT files (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`mt-6 p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <span className="font-medium">{uploadStatus.message}</span>
            </div>
            
            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-2 text-gray-600">{uploadProgress}% complete</p>
              </div>
            )}
          </div>
        )}

        {/* File Requirements */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="notion-subtitle mb-4">File Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Maximum file size: 10MB</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Supported formats: PDF, DOCX, TXT</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Files will be processed and indexed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Content will be searchable via AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 