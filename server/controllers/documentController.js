const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { processDocument, isValidFileType, getFileSize } = require('../services/documentService');
const { generateEmbeddingsBatch } = require('../services/openaiService');
const { upsertVectors, deleteVectors, getIndexStats, queryVectors } = require('../services/pineconeService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

// Upload and process document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, path: filePath } = req.file;
    const fileType = path.extname(originalname).toLowerCase().substring(1);

    console.log(`📤 Processing upload: ${originalname}`);

    // Process the document
    const processedDoc = await processDocument(filePath, originalname, fileType);
    
    // Get file size before deleting the file
    const fileSize = await getFileSize(filePath);
    
    // Generate embeddings for all chunks
    const texts = processedDoc.chunks.map(chunk => chunk.text);
    const embeddings = await generateEmbeddingsBatch(texts);

    // Prepare vectors for Pinecone
    const vectors = processedDoc.chunks.map((chunk, index) => ({
      id: chunk.id,
      values: embeddings[index],
      metadata: {
        ...chunk.metadata,
        text: chunk.text // Include the actual text content in metadata
      }
    }));

    // Store in Pinecone
    await upsertVectors(vectors);

    // Clean up uploaded file
    await fs.unlink(filePath);

    console.log(`✅ Successfully processed and indexed: ${originalname}`);

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      document: {
        id: processedDoc.documentId,
        name: processedDoc.originalName,
        type: processedDoc.fileType,
        chunks: processedDoc.totalChunks,
        size: fileSize
      }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to process document',
      message: error.message
    });
  }
});

// Get all documents (from Pinecone metadata)
router.get('/list', async (req, res) => {
  try {
    const stats = await getIndexStats();
    // Use a dummy vector for similarity search (returns topK vectors)
    const dummyVector = new Array(stats.dimension || 1536).fill(0);
    const allVectors = await queryVectors(dummyVector, 1000);

    // Group by documentId
    const documentsMap = new Map();
    allVectors.forEach((vector) => {
      const meta = vector.metadata;
      if (meta && meta.documentId) {
        if (!documentsMap.has(meta.documentId)) {
          documentsMap.set(meta.documentId, {
            id: meta.documentId,
            name: meta.documentName || 'Unknown',
            type: meta.fileType || 'unknown',
            totalChunks: meta.totalChunks || 0,
            uploadedAt: meta.timestamp || '',
          });
        }
      }
    });
    const documents = Array.from(documentsMap.values());

    res.json({
      success: true,
      documents,
      stats: {
        totalVectors: stats.totalVectorCount || 0,
        totalDocuments: documents.length,
        dimension: stats.dimension || 1536
      }
    });
  } catch (error) {
    console.error('❌ Failed to get documents:', error);
    res.status(500).json({
      error: 'Failed to retrieve documents',
      message: error.message
    });
  }
});

// Delete document and all its chunks
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get all vectors for this document
    const stats = await getIndexStats();
    const vectorsToDelete = [];

    // This is a simplified approach - in a real app, you'd store document metadata separately
    // For now, we'll return success but note that this needs enhancement
    console.log(`🗑️ Delete request for document: ${documentId}`);

    res.json({
      success: true,
      message: 'Document deletion requested (implementation needed)',
      documentId
    });

  } catch (error) {
    console.error('❌ Failed to delete document:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// Get document statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getIndexStats();
    
    res.json({
      success: true,
      stats: {
        totalVectors: stats.totalVectorCount || 0,
        namespaces: Object.keys(stats.namespaces || {}),
        dimension: stats.dimension || 1536,
        indexFullness: stats.indexFullness || 0
      }
    });

  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }

  next(error);
});

module.exports = router; 