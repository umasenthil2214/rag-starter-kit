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
        // Look for sentence endings (.!?) in a wider range
        const searchStart = Math.max(startIndex, endIndex - 400);
        const searchEnd = endIndex;
        
        const sentenceEnd = cleanedText.lastIndexOf('.', searchEnd);
        const exclamationEnd = cleanedText.lastIndexOf('!', searchEnd);
        const questionEnd = cleanedText.lastIndexOf('?', searchEnd);
        
        const lastSentenceEnd = Math.max(sentenceEnd, exclamationEnd, questionEnd);
        
        // If we found a sentence end within the search range, use it
        if (lastSentenceEnd >= searchStart && lastSentenceEnd > startIndex + chunkSize - 400) {
          endIndex = lastSentenceEnd + 1;
        } else {
          // Otherwise, try to break at a word boundary
          const lastSpace = cleanedText.lastIndexOf(' ', endIndex);
          if (lastSpace > startIndex + chunkSize - 200) {
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

    console.log(`📖 ORIGINAL FILE CONTENT (${text.length} characters):`);
    console.log('---START ORIGINAL CONTENT---');
    console.log(text);
    console.log('---END ORIGINAL CONTENT---');

    // Use the full original text for chunking (no filtering)
    const processedText = text;
    
    // Split processed text into chunks
    const chunks = splitTextIntoChunks(processedText);
    
    console.log(`✅ Extracted ${chunks.length} chunks from ${originalName}`);
    
    // Log each chunk that will be stored
    chunks.forEach((chunk, index) => {
      console.log(`\n📦 CHUNK ${index + 1} (${chunk.length} characters):`);
      console.log('---START CHUNK---');
      console.log(chunk);
      console.log('---END CHUNK---');
    });

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

// Split structured text into individual information lines
function splitStructuredText(text) {
  try {
    console.log(`🔍 Analyzing text for structured content...`);
    
    // Split by common separators and clean up
    const allLines = text.split(/[\n\r]+/); // split by newlines
    console.log(`📝 Found ${allLines.length} total lines`);
    
    const trimmedLines = allLines
      .map(line => line.trim()) // remove leading/trailing whitespace
      .filter(line => line.length > 0); // remove empty lines
    console.log(`📝 After trimming: ${trimmedLines.length} non-empty lines`);
    
    const structuredLines = trimmedLines.filter(line => {
      // Keep lines that look like structured data (key-value pairs)
      const isStructured = line.includes(':') || 
             line.includes('=') || 
             line.match(/^[A-Z][a-z\s]+:/) || // Title: Value
             line.match(/^[A-Z\s]+:/) || // KEY: value
             line.match(/^[a-z\s]+:\s/) || // key: value
             line.match(/^[A-Z][a-z]+:\s/); // Key: value
      
      if (!isStructured) {
        console.log(`❌ Filtered out line: "${line}"`);
      }
      
      return isStructured;
    });
    
    console.log(`✅ Kept ${structuredLines.length} structured lines`);
    return structuredLines;
  } catch (error) {
    console.error('❌ Failed to split structured text:', error);
    return [text]; // Return original text as single line if splitting fails
  }
}

// Process any document and extract structured information
function processStructuredDocument(text) {
  try {
    console.log(`🔧 Processing document for structured information...`);
    
    // First try to split as structured text
    const structuredLines = splitStructuredText(text);
    
    if (structuredLines.length > 1) {
      // If we found multiple structured lines, use them
      console.log(`📋 Found ${structuredLines.length} structured information lines`);
      const result = structuredLines.join('\n');
      console.log(`📋 Final processed text length: ${result.length} characters`);
      return result;
    } else {
      // If no structured format found, return original text
      console.log(`📋 No structured format detected, using original text`);
      console.log(`📋 Original text length: ${text.length} characters`);
      return text;
    }
  } catch (error) {
    console.error('❌ Failed to process structured document:', error);
    return text; // Return original text if processing fails
  }
}

module.exports = {
  extractTextFromFile,
  splitTextIntoChunks,
  processDocument,
  getFileType,
  isValidFileType,
  getFileSize,
  splitStructuredText,
  processStructuredDocument
}; 