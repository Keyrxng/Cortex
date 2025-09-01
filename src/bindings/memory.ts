/**
 * Memory System Bindings for Agentic Agent
 *
 * Provides a clean interface to the agentic-memory system following
 * the same architectural patterns and error handling conventions.
 */

import { AgentGraphMemory } from "agentic-memory";
import type { GraphContext } from '../types.js';

export type MemoryInstance = any;

/**
 * Configuration for memory system
 */
export interface MemoryConfig {
  graph?: {
    maxNodes?: number;
    maxEdgesPerNode?: number;
    entityResolutionThreshold?: number;
  };
  extraction?: {
    entityConfidenceThreshold?: number;
    relationshipConfidenceThreshold?: number;
    maxEntitiesPerText?: number;
  };
  memory?: {
    maxMemoryNodes?: number;
    evictionStrategy?: 'lru' | 'lfu' | 'temporal';
    persistenceEnabled?: boolean;
  };
}

/**
 * Configuration for clustering
 */
export interface ClusteringConfig {
  enabled: boolean;
  similarityThreshold: number;
  maxClusters: number;
  minClusterSize: number;
  clusteringAlgorithm: 'kmeans' | 'hierarchical';
}

/**
 * Create a memory instance with proper configuration
 */
export async function createMemoryInstance(config: MemoryConfig = {}): Promise<MemoryInstance> {
  try {
    console.log('🧠 Initializing memory system...');

    // Default configuration following agentic-memory patterns
    const defaultConfig = {
      graph: {
        maxNodes: 10000,
        maxEdgesPerNode: 100,
        entityResolutionThreshold: 0.8,
        ...config.graph
      },
      extraction: {
        entityConfidenceThreshold: 0.7,
        relationshipConfidenceThreshold: 0.6,
        maxEntitiesPerText: 50,
        ...config.extraction
      },
      memory: {
        maxMemoryNodes: 5000,
        evictionStrategy: 'lru' as const,
        persistenceEnabled: false,
        ...config.memory
      }
    };

    const memory = new AgentGraphMemory(defaultConfig);
    await memory.initialize();

    console.log('✅ Memory system initialized successfully');
    return memory;

  } catch (error) {
    console.error('❌ Failed to create memory instance:', error);
    throw new Error(`Memory initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add memory content to the knowledge graph
 */
export async function addMemory(
  memory: MemoryInstance,
  content: string,
  context: GraphContext,
  options: { embeddings?: number[] } = {}
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    console.log(`📝 Adding memory: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);

    const result = await memory.addMemory(content, context, options);

    console.log(`✅ Memory added successfully - ${result.metadata?.entitiesExtracted || 0} entities, ${result.metadata?.relationshipsExtracted || 0} relationships`);

    return result;

  } catch (error) {
    console.error('❌ Failed to add memory:', error);
    throw new Error(`Memory addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Query memory for relevant information
 */
export async function queryMemory(
  memory: MemoryInstance,
  query: string,
  context: GraphContext,
  options: {
    maxResults?: number;
    maxDepth?: number;
    includeRelated?: boolean;
    queryEmbedding?: Float32Array;
  } = {}
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    console.log(`🔍 Querying memory: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"${options.queryEmbedding ? ' (with semantic search)' : ''}`);

    const result = await memory.queryMemory(query, context, options);

    console.log(`✅ Query completed - found ${result.entities?.length || 0} entities in ${result.metadata?.queryTime || 0}ms`);

    return result;

  } catch (error) {
    console.error('❌ Failed to query memory:', error);
    throw new Error(`Memory query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create semantic clusters from memory nodes
 */
export async function createClusters(
  memory: MemoryInstance,
  config: ClusteringConfig = {
    enabled: true,
    similarityThreshold: 0.7,
    maxClusters: 10,
    minClusterSize: 2,
    clusteringAlgorithm: 'kmeans'
  }
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    console.log(`🔍 Creating semantic clusters with ${config.clusteringAlgorithm} algorithm...`);

    const clusters = await memory.createClusters(config);

    console.log(`✅ Created ${clusters.length} clusters`);

    return clusters;

  } catch (error) {
    console.error('❌ Failed to create clusters:', error);
    throw new Error(`Cluster creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find clusters related to a query
 */
export async function findRelatedClusters(
  memory: MemoryInstance,
  queryEmbedding: Float32Array,
  clusters: any[],
  maxResults: number = 5
): Promise<any[]> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    console.log(`🔍 Finding related clusters for query...`);

    const relatedClusters = await memory.findRelatedClusters(queryEmbedding, clusters, maxResults);

    console.log(`✅ Found ${relatedClusters.length} related clusters`);

    return relatedClusters;

  } catch (error) {
    console.error('❌ Failed to find related clusters:', error);
    throw new Error(`Related cluster search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get contextual memories based on conversation history
 */
export async function getContextualMemories(
  memory: MemoryInstance,
  conversationHistory: Array<{ role: string; content: string }>,
  maxMemories: number = 5
): Promise<any[]> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    console.log(`🎯 Finding contextual memories for conversation...`);

    const contextualMemories = await memory.getContextualMemories(conversationHistory, maxMemories);

    console.log(`✅ Retrieved ${contextualMemories.length} contextual memories`);

    return contextualMemories;

  } catch (error) {
    console.error('❌ Failed to get contextual memories:', error);
    throw new Error(`Contextual memory retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced entity resolution using embeddings
 */
export async function resolveEntityWithEmbeddings(
  memory: MemoryInstance,
  entity: any,
  candidateEntities: any[]
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    console.log(`🔍 Resolving entity with embeddings: ${entity.name || entity.id}`);

    const result = await memory.resolveEntityWithEmbeddings(entity, candidateEntities);

    console.log(`✅ Entity resolution completed - ${result.bestMatch ? 'Match found' : 'No match found'}`);

    return result;

  } catch (error) {
    console.error('❌ Failed to resolve entity with embeddings:', error);
    throw new Error(`Entity resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get memory system metrics
 */
export async function getMemoryMetrics(memory: MemoryInstance): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    return await memory.getMetrics();

  } catch (error) {
    console.error('❌ Failed to get memory metrics:', error);
    throw new Error(`Memory metrics retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear all memory (useful for testing)
 */
export async function clearMemory(memory: MemoryInstance): Promise<void> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    await memory.clear();
    console.log('🧹 Memory cleared successfully');

  } catch (error) {
    console.error('❌ Failed to clear memory:', error);
    throw new Error(`Memory clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
