const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate embeddings for text
async function generateEmbeddings(text) {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embeddings:', error);
    throw error;
  }
}

// Generate embeddings for multiple texts
async function generateEmbeddingsBatch(texts) {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      input: texts
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error('❌ Failed to generate embeddings batch:', error);
    throw error;
  }
}

// Generate chat completion with context
async function generateChatCompletion(question, context = '') {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant. Answer the user's question using ONLY the information provided in the context below. Look carefully through the context to find the specific information requested. If the answer is not in the context, say "I don't have enough information to answer that question."

Context:
${context}`
    };

    const userMessage = {
      role: 'user',
      content: question
    };

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      temperature: 0.3, // Slightly higher temperature for better response accuracy
      max_tokens: 500, // Shorter responses for more focused answers
      stream: false
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Failed to generate chat completion:', error);
    throw error;
  }
}


// Generate streaming chat completion
async function generateStreamingChatCompletion(messages, context = '', onChunk) {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant. Answer the user's question using ONLY the information provided in the context below. Look carefully through the context to find the specific information requested. If the answer is not in the context, say "I don't have enough information to answer that question."

Context:
${context}`
    };

    const allMessages = [systemMessage, ...messages];

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: allMessages,
      temperature: 0.3, // Slightly higher temperature for better response accuracy
      max_tokens: 500, // Shorter responses for more focused answers
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error('❌ Failed to generate streaming chat completion:', error);
    throw error;
  }
}

// Validate OpenAI API key
async function validateApiKey() {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('❌ Invalid OpenAI API key:', error);
    return false;
  }
}

// Get available models
async function getAvailableModels() {
  try {
    const response = await openai.models.list();
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get models:', error);
    throw error;
  }
}

module.exports = {
  generateEmbeddings,
  generateEmbeddingsBatch,
  generateChatCompletion,
  generateStreamingChatCompletion,
  validateApiKey,
  getAvailableModels
}; 