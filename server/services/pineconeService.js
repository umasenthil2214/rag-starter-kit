import { Pinecone } from '@pinecone-database/pinecone';

let pinecone;
let index;

// Initialize Pinecone connection
export async function initializePinecone() {
  try {
    // Create Pinecone instance
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    console.log(pinecone);
    

    // Get or create index
    const indexName = process.env.PINECONE_INDEX_NAME || 'rag-starter-kit';
    const cloud = process.env.PINECONE_CLOUD || 'aws';
    const region = process.env.PINECONE_REGION || 'us-east-1';
    const embedModel = process.env.PINECONE_EMBED_MODEL || 'text-embedding-3-small';
    const embedField = process.env.PINECONE_EMBED_FIELD || 'chunk_text';
    
    console.log(`🔍 Checking Pinecone index: ${indexName}`);
    console.log(`🌍 Environment: ${process.env.PINECONE_ENVIRONMENT}`);
    console.log(`☁️ Cloud: ${cloud}`);
    console.log(`📍 Region: ${region}`);
    console.log(`🤖 Embed Model: ${embedModel}`);
    console.log(`📝 Embed Field: ${embedField}`);


   

    // Check if index exists
    const indexesResponse = await pinecone.listIndexes();
    const indexes = indexesResponse.indexes || [];
    
    console.log(`📋 Available indexes:`, indexes.map(idx => idx.name));
    const indexExists = indexes.some(idx => idx.name === indexName);

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName}`);
      await pinecone.createIndex({
        name: indexName,
        dimension: parseInt(process.env.PINECONE_DIMENSION) || 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: process.env.PINECONE_CLOUD || 'aws',
            region: process.env.PINECONE_REGION || 'us-east-1',
          },
        },
      });
      
      console.log('✅ Index created successfully!');
    }

    // Get the index
    index = pinecone.index(indexName);
    console.log(`✅ Pinecone index '${indexName}' is ready`);
    
  } catch (error) {
    console.error('❌ Failed to initialize Pinecone:', error);
    console.error('🔍 Debug info:');
    console.error('  - API Key length:', process.env.PINECONE_API_KEY?.length || 0);
    console.error('  - Environment:', process.env.PINECONE_ENVIRONMENT);
    console.error('  - Index Name:', process.env.PINECONE_INDEX_NAME);
    throw error;
  }
}

// Upsert vectors (store embeddings)
export async function upsertVectors(vectors) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }
    
    const result = await index.upsert(vectors);
    console.log(`✅ Upserted ${vectors.length} vectors`);
    return result;
  } catch (error) {
    console.error('❌ Failed to upsert vectors:', error);
    throw error;
  }
}

// Query vectors (search for similar embeddings)
export async function queryVectors(vector, topK = 5, filter = null) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }
    
    const queryOptions = {
      vector: vector,
      topK: topK,
      includeMetadata: true
    };
    
    // Only add filter if it's provided and not empty
    if (filter && Object.keys(filter).length > 0) {
      queryOptions.filter = filter;
    }
    
    const queryResponse = await index.query(queryOptions);
    
    return queryResponse.matches;
  } catch (error) {
    console.error('❌ Failed to query vectors:', error);
    throw error;
  }
}

// Delete vectors by IDs
export async function deleteVectors(ids) {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }
    
    const result = await index.deleteMany(ids);
    console.log(`✅ Deleted ${ids.length} vectors`);
    return result;
  } catch (error) {
    console.error('❌ Failed to delete vectors:', error);
    throw error;
  }
}

// Get index stats
export async function getIndexStats() {
  try {
    if (!index) {
      throw new Error('Pinecone index not initialized');
    }
    
    const stats = await index.describeIndexStats();
    
    // Extract the correct total vector count
    const totalVectors = stats.totalRecordCount || 0;
    
    return {
      ...stats,
      totalVectorCount: totalVectors
    };
  } catch (error) {
    console.error('❌ Failed to get index stats:', error);
    throw error;
  }
}

