import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus?.type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Upload Documents
          </h2>
          <p className="text-gray-600">
            Upload PDF, DOCX, or TXT files to add them to your knowledge base
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : isDragReject
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <div className="text-center">
              {isDragActive ? (
                <p className="text-primary-600 font-medium">
                  Drop the file here...
                </p>
              ) : isDragReject ? (
                <p className="text-red-600 font-medium">
                  File type not supported
                </p>
              ) : (
                <>
                  <p className="text-gray-600 font-medium">
                    Drag & drop a file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports PDF, DOCX, and TXT files (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`mt-4 p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <span className="font-medium">{uploadStatus.message}</span>
            </div>
            
            {/* Progress Bar */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-1">{uploadProgress}% complete</p>
              </div>
            )}
          </div>
        )}

        {/* File Requirements */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">File Requirements</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Maximum file size: 10MB</li>
            <li>• Supported formats: PDF, DOCX, TXT</li>
            <li>• Files will be processed and indexed for search</li>
            <li>• Processing may take a few moments for large files</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 