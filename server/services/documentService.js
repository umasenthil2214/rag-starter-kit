const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');

// Extract text from different file types
async function extractTextFromFile(filePath, fileType) {
  try {
    const buffer = await fs.readFile(filePath);
    
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await extractTextFromPDF(buffer);
      case 'docx':
        return await extractTextFromDOCX(buffer);
      case 'txt':
        return await extractTextFromTXT(buffer);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(`❌ Failed to extract text from ${filePath}:`, error);
    throw error;
  }
}

// Extract text from PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('❌ Failed to parse PDF:', error);
    throw error;
  }
}

// Extract text from DOCX
async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('❌ Failed to parse DOCX:', error);
    throw error;
  }
}

// Extract text from TXT
async function extractTextFromTXT(buffer) {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('❌ Failed to parse TXT:', error);
    throw error;
  }
}

// Split text into chunks
function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  try {
    // Clean the text
    const cleanedText = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    if (cleanedText.length <= chunkSize) {
      return [cleanedText];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < cleanedText.length) {
      let endIndex = startIndex + chunkSize;

      // If this isn't the last chunk, try to break at a sentence boundary
      if (endIndex < cleanedText.length) {
        // Look for sentence endings (.!?) followed by space or newline
        const sentenceEnd = cleanedText.lastIndexOf('.', endIndex);
        const exclamationEnd = cleanedText.lastIndexOf('!', endIndex);
        const questionEnd = cleanedText.lastIndexOf('?', endIndex);
        
        const lastSentenceEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd);
        
        // If we found a sentence end within the last 200 characters, use it
        if (lastSentenceEnd > startIndex + chunkSize - 200) {
          endIndex = lastSentenceEnd + 1;
        } else {
          // Otherwise, try to break at a word boundary
          const lastSpace = cleanedText.lastIndexOf(' ', endIndex);
          if (lastSpace > startIndex + chunkSize - 100) {
            endIndex = lastSpace;
          }
        }
      }

      const chunk = cleanedText.slice(startIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move start index for next chunk, with overlap
      startIndex = endIndex - overlap;
      if (startIndex >= cleanedText.length) break;
    }

    return chunks;
  } catch (error) {
    console.error('❌ Failed to split text into chunks:', error);
    throw error;
  }
}

// Process document and create chunks with metadata
async function processDocument(filePath, originalName, fileType) {
  try {
    console.log(`📄 Processing document: ${originalName}`);
    
    // Extract text from file
    const text = await extractTextFromFile(filePath, fileType);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in document');
    }

    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    
    console.log(`✅ Extracted ${chunks.length} chunks from ${originalName}`);

    // Create metadata for each chunk
    const documentId = uuidv4();
    const processedChunks = chunks.map((chunk, index) => ({
      id: `${documentId}_chunk_${index}`,
      text: chunk,
      metadata: {
        documentId: documentId,
        documentName: originalName,
        fileType: fileType,
        chunkIndex: index,
        totalChunks: chunks.length,
        timestamp: new Date().toISOString()
      }
    }));

    return {
      documentId,
      originalName,
      fileType,
      totalChunks: chunks.length,
      chunks: processedChunks
    };
  } catch (error) {
    console.error(`❌ Failed to process document ${originalName}:`, error);
    throw error;
  }
}

// Get file type from filename
function getFileType(filename) {
  const extension = path.extname(filename).toLowerCase();
  const typeMap = {
    '.pdf': 'pdf',
    '.docx': 'docx',
    '.doc': 'docx',
    '.txt': 'txt'
  };
  
  return typeMap[extension] || null;
}

// Validate file type
function isValidFileType(filename) {
  const fileType = getFileType(filename);
  return fileType !== null;
}

// Get file size in MB
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return (stats.size / (1024 * 1024)).toFixed(2); // Convert to MB
  } catch (error) {
    console.error('❌ Failed to get file size:', error);
    throw error;
  }
}

module.exports = {
  extractTextFromFile,
  splitTextIntoChunks,
  processDocument,
  getFileType,
  isValidFileType,
  getFileSize
}; 