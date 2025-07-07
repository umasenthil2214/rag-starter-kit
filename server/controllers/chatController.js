const express = require('express');
const { generateEmbeddings, generateChatCompletion, generateStreamingChatCompletion } = require('../services/openaiService');
const { queryVectors } = require('../services/pineconeService');

const router = express.Router();

// Store conversation history (in production, use a database)
const conversations = new Map();

// Send message and get AI response
router.post('/send', async (req, res) => {
  try {
    const { message, conversationId, useStreaming = false } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Please provide a message'
      });
    }

    console.log(`\n🚀 STEP 1: Processing user message`);
    console.log(`💬 User message: ${message.substring(0, 50)}...`);

    // Generate embedding for the user's question
    console.log(`\n🚀 STEP 2: Generating embedding for user query`);
    const questionEmbedding = await generateEmbeddings(message);
    console.log(`✅ Embedding generated successfully`);

    // Search for relevant context in Pinecone
    console.log(`\n🚀 STEP 3: Searching Pinecone database for similar vectors`);
    const relevantChunks = await queryVectors(questionEmbedding, 5);
    
    console.log(`✅ Found ${relevantChunks.length} relevant chunks from Pinecone`);
    
    // Log detailed information about each matching chunk
    console.log('\n📋 MATCHING CHUNKS DETAILS:');
    relevantChunks.forEach((chunk, index) => {
      const meta = chunk.metadata;
      console.log(`\n🎯 Match ${index + 1} (Score: ${chunk.score?.toFixed(4) || 'N/A'}):`);
      console.log(`   📄 Document: ${meta?.documentName || 'Unknown'}`);
      console.log(`   📝 Chunk Index: ${meta?.chunkIndex || 'N/A'}`);
      console.log(`   📏 Text Length: ${(meta?.text || '').length} characters`);
      
      if (meta?.text) {
        console.log(`   📖 FULL TEXT CONTENT:`);
        console.log(`   "${meta.text}"`);
      } else {
        console.log(`   ❌ NO TEXT CONTENT FOUND`);
      }
    });

    // Build context from relevant chunks
    console.log(`\n🚀 STEP 4: Building context from relevant chunks`);
    const context = relevantChunks
      .map(chunk => {
        // Try different ways to get the text content
        const text = chunk.metadata?.text || chunk.text || chunk.metadata?.chunk_text || '';
        return text;
      })
      .filter(text => text.length > 0)
      .join('\n\n');
    
    console.log(`✅ Context built successfully (${context.length} characters)`);
    console.log(`📊 Context preview: ${context.substring(0, 200)}...`);

    // Get or create conversation history
    let conversation = conversations.get(conversationId) || [];
    
    // Add user message to conversation
    conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Generate AI response
    let aiResponse;
    if (useStreaming) {
      // For streaming, we'll handle this differently
      
      // Log what's being sent to ChatGPT
      console.log('\n🚀 STEP 5: Sending to OpenAI ChatGPT (STREAMING MODE)');
      console.log('📝 User Question:', message);
      console.log('📚 Context Length:', context.length, 'characters');
      console.log('📖 Context being sent to OpenAI:');
      console.log('---START CONTEXT---');
      console.log(context);
      console.log('---END CONTEXT---');
      
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });

      let responseText = '';
      await generateStreamingChatCompletion(
        conversation.slice(0, -1), // Exclude the current message
        context,
        (chunk) => {
          responseText += chunk;
          res.write(chunk);
        }
      );
      
      console.log('✅ OpenAI ChatGPT Response received (Streaming):');
      console.log('🤖 Response:', responseText);

      // Add AI response to conversation
      conversation.push({
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString()
      });

      // Save conversation
      if (conversationId) {
        conversations.set(conversationId, conversation);
      }

      res.end();
      return;

    } else {
      // Non-streaming response
      
      // Log what's being sent to ChatGPT
      console.log('\n🚀 STEP 5: Sending to OpenAI ChatGPT');
      console.log('📝 User Question:', message);
      console.log('📚 Context Length:', context.length, 'characters');
      console.log('📖 Context being sent to OpenAI:');
      console.log('---START CONTEXT---');
      console.log(context);
      console.log('---END CONTEXT---');
      
      aiResponse = await generateChatCompletion(
        message, // Pass the current user message
        context
      );
      
      console.log('✅ OpenAI ChatGPT Response received:');
      console.log('🤖 Response:', aiResponse);

      // Add AI response to conversation
      conversation.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });

      // Save conversation
      if (conversationId) {
        conversations.set(conversationId, conversation);
      }

      res.json({
        success: true,
        response: aiResponse,
        conversationId: conversationId,
        context: {
          chunksFound: relevantChunks.length,
          sources: relevantChunks.map(chunk => ({
            documentName: chunk.metadata?.documentName || 'Unknown',
            chunkIndex: chunk.metadata?.chunkIndex || 0,
            score: chunk.score
          }))
        }
      });
    }

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
});

// Get conversation history
router.get('/history/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = conversations.get(conversationId) || [];

    res.json({
      success: true,
      conversation: conversation,
      conversationId: conversationId
    });

  } catch (error) {
    console.error('❌ Failed to get conversation history:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      message: error.message
    });
  }
});

// Create new conversation
router.post('/conversation', (req, res) => {
  try {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize empty conversation
    conversations.set(conversationId, []);

    res.json({
      success: true,
      conversationId: conversationId,
      message: 'New conversation created'
    });

  } catch (error) {
    console.error('❌ Failed to create conversation:', error);
    res.status(500).json({
      error: 'Failed to create conversation',
      message: error.message
    });
  }
});

// Delete conversation
router.delete('/conversation/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (conversations.has(conversationId)) {
      conversations.delete(conversationId);
      res.json({
        success: true,
        message: 'Conversation deleted successfully'
      });
    } else {
      res.status(404).json({
        error: 'Conversation not found',
        message: 'The specified conversation does not exist'
      });
    }

  } catch (error) {
    console.error('❌ Failed to delete conversation:', error);
    res.status(500).json({
      error: 'Failed to delete conversation',
      message: error.message
    });
  }
});

// Get all conversations (for admin/debugging)
router.get('/conversations', (req, res) => {
  try {
    const conversationList = Array.from(conversations.entries()).map(([id, messages]) => ({
      id: id,
      messageCount: messages.length,
      lastMessage: messages.length > 0 ? messages[messages.length - 1].timestamp : null
    }));

    res.json({
      success: true,
      conversations: conversationList,
      total: conversationList.length
    });

  } catch (error) {
    console.error('❌ Failed to get conversations:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversations',
      message: error.message
    });
  }
});

// Search for relevant documents (for debugging)
router.post('/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query is required',
        message: 'Please provide a search query'
      });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbeddings(query);

    // Search for relevant chunks
    const relevantChunks = await queryVectors(queryEmbedding, topK);

    res.json({
      success: true,
      query: query,
      results: relevantChunks.map(chunk => ({
        id: chunk.id,
        text: chunk.metadata?.text || chunk.text || '',
        score: chunk.score,
        metadata: chunk.metadata
      }))
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      message: error.message
    });
  }
});

module.exports = router; 