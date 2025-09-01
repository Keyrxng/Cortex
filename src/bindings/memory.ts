/**
 * Memory System Bindings for Agentic Agent
 *
 * Provides a clean interface to the agentic-memory dual graph system following
 * the same architectural patterns and error handling conventions.
 */

import {
  AgentGraphMemory,
  type DualGraphQuery,
  type DualGraphQueryResult
} from "agentic-memory";
import type { GraphContext } from '../types.js';
import type { MemoryCluster } from 'agentic-memory/src/utils/clustering-engine.js';
import type { GraphNode } from 'agentic-memory/src/core/types.js';

export type MemoryInstance = AgentGraphMemory;

/**
 * Configuration for memory system with dual graph support
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
  /** Dual graph configuration */
  dualGraph?: {
    enabled?: boolean;
    lexical?: {
      minChunkSize?: number;
      maxChunkSize?: number;
      enableSentenceChunking?: boolean;
      enableParagraphChunking?: boolean;
      enableEmbeddings?: boolean;
      enableLexicalRelations?: boolean;
    };
    domain?: {
      enableHierarchies?: boolean;
      enableTaxonomies?: boolean;
      enableOrganizationalStructures?: boolean;
      enableConceptClustering?: boolean;
      minHierarchyConfidence?: number;
    };
    linking?: {
      enableEntityMentions?: boolean;
      enableEvidenceSupport?: boolean;
      enableSemanticGrounding?: boolean;
      enableTemporalAlignment?: boolean;
      minLinkConfidence?: number;
      maxLinksPerEntity?: number;
    };
    processing?: {
      enableParallelProcessing?: boolean;
      enableProgressTracking?: boolean;
      enableDetailedLogging?: boolean;
    };
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
 * Create a memory instance with dual graph configuration
 */
export async function createMemoryInstance(config: MemoryConfig = {}): Promise<MemoryInstance> {
  try {
    console.log('🧠 Initializing dual graph memory system...');

    // Default configuration following agentic-memory dual graph patterns
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
      },
      dualGraph: {
        enabled: config.dualGraph?.enabled ?? true, // Enable dual graph by default
        lexical: {
          minChunkSize: 50,
          maxChunkSize: 1000,
          enableSentenceChunking: true,
          enableParagraphChunking: true,
          enableEmbeddings: true,
          enableLexicalRelations: true,
          ...config.dualGraph?.lexical
        },
        domain: {
          enableHierarchies: true,
          enableTaxonomies: true,
          enableOrganizationalStructures: true,
          enableConceptClustering: true,
          minHierarchyConfidence: 0.7,
          ...config.dualGraph?.domain
        },
        linking: {
          enableEntityMentions: true,
          enableEvidenceSupport: true,
          enableSemanticGrounding: true,
          enableTemporalAlignment: true,
          minLinkConfidence: 0.6,
          maxLinksPerEntity: 10,
          ...config.dualGraph?.linking
        },
        processing: {
          enableParallelProcessing: false,
          enableProgressTracking: true,
          enableDetailedLogging: false,
          ...config.dualGraph?.processing
        }
      }
    };

    const memory = new AgentGraphMemory(defaultConfig);
    await memory.initialize();

    // Log dual graph statistics
    const dualGraphStats = await memory.getIntegratedStats();
    console.log('✅ Dual graph memory system initialized successfully');
    console.log(`   - Dual graph enabled: ${defaultConfig.dualGraph.enabled}`);
    console.log(`   - Lexical graphs: ${dualGraphStats.dualGraph.lexicalGraphs}`);
    console.log(`   - Domain graphs: ${dualGraphStats.dualGraph.domainGraphs}`);
    console.log(`   - Cross-graph links: ${dualGraphStats.dualGraph.crossGraphLinks}`);
    console.log(`   - Total relationships: ${dualGraphStats.dualGraph.totalRelationships}`);
    console.log(`   - Total entities: ${dualGraphStats.dualGraph.totalEntities}`);
    console.log(`   - Total chunks: ${dualGraphStats.dualGraph.totalChunks}`);

    console.log(`   - Clustering:`, dualGraphStats.clustering);
    console.log(`   - Graph:`, dualGraphStats.graph);
    console.log(`   - Indexing:`, dualGraphStats.indexing);
    console.log(`   - Memory:`, dualGraphStats.memory);
    console.log(`   - System:`, dualGraphStats.system);

    return memory;

  } catch (error) {
    console.error('❌ Failed to create dual graph memory instance:', error);
    throw new Error(`Dual graph memory initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add memory content using dual graph architecture
 */
export async function addMemory(
  memory: MemoryInstance,
  content: string,
  context: GraphContext,
  options: {
    embeddings?: number[];
    useDualGraph?: boolean;
    enableProgressTracking?: boolean;
  } = {}
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    console.log(`📝 Adding memory with dual graph: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);

    // Ensure relevantEntities is always an array
    const safeContext = {
      ...context,
      relevantEntities: context.relevantEntities || [],
      source: context.source || 'conversation'
    };

    const result = await memory.addMemory(content, safeContext, {
      useDualGraph: options.useDualGraph ?? true, // Use dual graph by default
      enableProgressTracking: options.enableProgressTracking ?? false
    });

    console.log(`✅ Memory added successfully - ${result.metadata?.entitiesExtracted || 0} entities, ${result.metadata?.relationshipsExtracted || 0} relationships`);

    // Log dual graph results if available
    if (result.dualGraphResult) {
      console.log(`   🧠 Dual graph results:`);
      console.log(`     - Lexical chunks: ${result.dualGraphResult.lexicalGraph.textChunks.size}`);
      console.log(`     - Domain entities: ${result.dualGraphResult.domainGraph.entities.size}`);
      console.log(`     - Cross-graph links: ${result.dualGraphResult.crossLinks.length}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Failed to add memory:', error);
    throw new Error(`Memory addition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Query memory using dual graph architecture
 */
export async function queryMemory(
  memory: MemoryInstance,
  query: string | DualGraphQuery,
  context: GraphContext,
  options: {
    maxResults?: number;
    maxDepth?: number;
    includeRelated?: boolean;
    queryEmbedding?: Float32Array;
    useDualGraph?: boolean;
    limit?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    if (!query || (typeof query === 'string' && query.trim() === '')) {
      throw new Error('Query must be a non-empty string or valid dual graph query');
    }

    const queryText = typeof query === 'string' ? query : JSON.stringify(query);
    console.log(`🔍 Querying memory with dual graph: "${queryText.substring(0, 100)}${queryText.length > 100 ? '...' : ''}"${options.queryEmbedding ? ' (with semantic search)' : ''}`);

    // Ensure relevantEntities is always an array
    const safeContext = {
      ...context,
      relevantEntities: context.relevantEntities || [],
      source: context.source || 'conversation'
    };

    const result = await memory.queryMemory(query, safeContext, {
      useDualGraph: options.useDualGraph ?? true, // Use dual graph by default
      limit: options.limit ?? options.maxResults,
      includeMetadata: options.includeMetadata ?? true
    });

    console.log(`✅ Query completed - found ${result.entities?.length || 0} entities in ${result.metadata?.queryTime || 0}ms`);

    // Log dual graph results if available
    if (result.dualGraphResults) {
      console.log(`   🧠 Dual graph query results:`);
      console.log(`     - Lexical chunks: ${result.dualGraphResults.lexicalResults.chunks.length}`);
      console.log(`     - Domain entities: ${result.dualGraphResults.domainResults.entities.length}`);
      console.log(`     - Cross-graph links: ${result.dualGraphResults.crossGraphResults.links.length}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Failed to query memory:', error);
    throw new Error(`Memory query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Advanced dual graph querying
 */
export async function queryDualGraph(
  memory: MemoryInstance,
  dualGraphQuery: DualGraphQuery,
  context: GraphContext,
  options: {
    limit?: number;
    includeMetadata?: boolean;
  } = {}
): Promise<DualGraphQueryResult> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    console.log(`🔍 Advanced dual graph querying...`);

    // Ensure relevantEntities is always an array
    const safeContext = {
      ...context,
      relevantEntities: context.relevantEntities || [],
      source: context.source || 'conversation'
    };

    const result = await memory.queryMemory(dualGraphQuery, safeContext, {
      useDualGraph: true,
      ...options
    });

    if (!result.dualGraphResults) {
      throw new Error('Dual graph results not available');
    }

    console.log(`✅ Dual graph query completed successfully`);
    return result.dualGraphResults;

  } catch (error) {
    console.error('❌ Failed to query dual graph:', error);
    throw new Error(`Dual graph query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get dual graph statistics
 */
export async function getDualGraphStats(memory: MemoryInstance): Promise<any> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    // Log dual graph statistics
    const dualGraphStats = await memory.getIntegratedStats();
    console.log(`   - Lexical graphs: ${dualGraphStats.dualGraph.lexicalGraphs}`);
    console.log(`   - Domain graphs: ${dualGraphStats.dualGraph.domainGraphs}`);
    console.log(`   - Cross-graph links: ${dualGraphStats.dualGraph.crossGraphLinks}`);
    console.log(`   - Total relationships: ${dualGraphStats.dualGraph.totalRelationships}`);
    console.log(`   - Total entities: ${dualGraphStats.dualGraph.totalEntities}`);
    console.log(`   - Total chunks: ${dualGraphStats.dualGraph.totalChunks}`);

    console.log(`   - Clustering:`, dualGraphStats.clustering);
    console.log(`   - Graph:`, dualGraphStats.graph);
    console.log(`   - Indexing:`, dualGraphStats.indexing);
    console.log(`   - Memory:`, dualGraphStats.memory);
    console.log(`   - System:`, dualGraphStats.system);

    return dualGraphStats;
  } catch (error) {
    console.error('❌ Failed to get dual graph stats:', error);
    throw new Error(`Dual graph stats retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const metrics = await memory.getMemoryStats();
    const dualGraphStats = memory.getIntegratedStats();

    return {
      ...metrics,
      dualGraph: dualGraphStats
    };

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

    await memory.clearMemory();
    console.log('🧹 Memory cleared successfully');

  } catch (error) {
    console.error('❌ Failed to clear memory:', error);
    throw new Error(`Memory clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create semantic clusters from memory nodes
 */
export async function createClusters(
  memory: MemoryInstance,
  config: ClusteringConfig
): Promise<MemoryCluster[]> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    return await memory.createClusters(config);

  } catch (error) {
    console.error('❌ Failed to create clusters:', error);
    throw new Error(`Cluster creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find clusters related to a query embedding
 */
export function findRelatedClusters(
  memory: MemoryInstance,
  queryEmbedding: Float32Array,
  clusters: MemoryCluster[],
  maxResults: number = 5
): MemoryCluster[] {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    return memory.findRelatedClusters(queryEmbedding, clusters, maxResults);

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
  maxResults: number = 5
): Promise<GraphNode[]> {
  try {
    if (!memory) {
      throw new Error('Memory instance not provided');
    }

    return await memory.getContextualMemories(conversationHistory, maxResults);

  } catch (error) {
    console.error('❌ Failed to get contextual memories:', error);
    throw new Error(`Contextual memory retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
