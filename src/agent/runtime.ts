/**
 * Agentic Agent Runtime
 *
 * Implements a sophisticated Personal Assistant/Technical Co-founder agent
 * following 12-factor agent principles and agentic-memory architectural patterns.
 *
 * Key Features:
 * - Advanced reasoning and planning capabilities
 * - Extensible capability/tool system
 * - Memory-bounded conversation management
 * - Context-aware decision making
 * - Comprehensive error handling and logging
 * - Production-ready monitoring and metrics
 */


import { generateText, generateEmbeddings } from 'local-stt-tts';
import { createMemoryInstance, addMemory, queryMemory, createClusters, findRelatedClusters, getContextualMemories, getDualGraphStats, MemoryInstance } from '../bindings/memory';
import { transcribeFromAudio, textToSpeech } from '../bindings/speech';
import { getAllToolCapabilities, getAllTools, TOOL_EXECUTORS } from '../tools/index';
import type {
  AgentContext,
  AgentConfig,
  AgentResponse,
  AgentMetrics,
  AgentState,
  AgentCapability,
  ConversationMessage,
  ReasoningStep,
  GraphContext
} from '../types';
import { AgentError, AgentErrorType } from '../types';
import { DEFAULT_CONFIG } from './config';
import { ConversationManager } from './conversation-manager';
import { MetricsTracker } from './metrics-tracker';

/**
 * Main Agent Runtime Class
 *
 * Implements the core agentic behavior with reasoning, planning, and tool use.
 * Follows the same architectural patterns as agentic-memory for consistency.
 */
export class AgentRuntime {
  private config: AgentConfig;
  private memory: MemoryInstance | null = null;
  private capabilities: Map<string, AgentCapability> = new Map();
  private toolExecutors: Map<string, (args: any) => Promise<any>> = new Map();
  private workingMemory: Map<string, any> = new Map();
  private conversationManager: ConversationManager;
  private metricsTracker: MetricsTracker;
  private isInitialized = false;

  // Clustering state
  private clusters: any[] = [];
  private lastClusteringUpdate: Date = new Date();
  private clusteringEnabled = true;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.conversationManager = new ConversationManager(this.config.memory.maxConversationHistory);
    this.metricsTracker = new MetricsTracker();
    this.registerCoreCapabilities();
  }


  /**
   * Initialize clustering system
   */
  private async initializeClustering(): Promise<void> {
    if (!this.clusteringEnabled) return;
    this.ensureInitialized();
    if (!this.memory) return;

    try {
      console.log('🔍 Initializing clustering system...');

      // Create initial clusters
      this.clusters = await createClusters(this.memory, {
        enabled: true,
        similarityThreshold: 0.7,
        maxClusters: 10,
        minClusterSize: 2,
        clusteringAlgorithm: 'kmeans'
      });

      this.lastClusteringUpdate = new Date();
      console.log(`✅ Clustering initialized with ${this.clusters.length} clusters`);

    } catch (error) {
      console.warn('⚠️ Failed to initialize clustering:', error);
      this.clusteringEnabled = false;
    }
  }

  /**
   * Update clustering periodically
   */
  async updateClusteringIfNeeded(): Promise<void> {
    if (!this.clusteringEnabled) return;
    this.ensureInitialized();
    if (!this.memory) return;

    const timeSinceLastUpdate = Date.now() - this.lastClusteringUpdate.getTime();
    const updateInterval = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastUpdate > updateInterval) {
      try {
        console.log('🔄 Updating clusters...');
        this.clusters = await createClusters(this.memory, {
          enabled: true,
          similarityThreshold: 0.7,
          maxClusters: 10,
          minClusterSize: 2,
          clusteringAlgorithm: 'kmeans'
        });
        this.lastClusteringUpdate = new Date();
        console.log(`✅ Clusters updated: ${this.clusters.length} clusters`);
      } catch (error) {
        console.warn('⚠️ Failed to update clusters:', error);
      }
    }
  }

  /**
   * Process a user request
   */
  async processRequest(
    input: string | { text?: string; audio?: string },
    context: Partial<GraphContext> = {}
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const requestId = this.generateId();

    try {
      await this.ensureInitialized();

      // Parse input
      const processedInput = await this.processInput(input);
      const fullContext = this.createAgentContext(context);

      // Add to conversation history
      this.addToConversationHistory('user', processedInput.content, fullContext);

      // Store in memory
      await this.storeInMemory(processedInput.content, fullContext);

      // Process through reasoning pipeline
      const response = await this.reasonAndRespond(processedInput.content, fullContext);

      // Add response to conversation history
      this.addToConversationHistory('assistant', response.content, fullContext);

      // Update metrics
      this.updateMetrics(startTime, true);

      // Handle audio if requested
      if (processedInput.generateAudio) {
        const audioPath = await this.generateAudioResponse(response.content);
        response.audioPath = audioPath;
      }

      return response;

    } catch (error) {
      console.error('❌ Error processing request:', error);
      this.updateMetrics(startTime, false);

      // Return error response
      const errorResponse: AgentResponse = {
        content: `I apologize, but I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'text',
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0
        }
      };

      return errorResponse;
    }
  }

  /**
   * Process input (text or audio)
   */
  private async processInput(input: string | { text?: string; audio?: string }): Promise<{
    content: string;
    source: 'text' | 'audio';
    generateAudio: boolean;
  }> {
    if (typeof input === 'string') {
      return {
        content: input,
        source: 'text',
        generateAudio: false
      };
    }

    if (input.audio) {
      const transcription = await transcribeFromAudio(input.audio);
      const content = typeof transcription === 'string'
        ? transcription
        : transcription.transcribedText || 'Audio transcription failed';

      return {
        content,
        source: 'audio',
        generateAudio: false // TODO:::
      };
    }

    if (input.text) {
      return {
        content: input.text,
        source: 'text',
        generateAudio: false
      };
    }

    return {
      content: 'Hello! How can I help you today?',
      source: 'text',
      generateAudio: false
    };
  }

  /**
   * Create agent context from partial context
   */
  private createAgentContext(partialContext: Partial<GraphContext>): AgentContext {
    const now = new Date();

    return {
      userId: partialContext.userId || 'default-user',
      sessionId: partialContext.sessionId || this.generateSessionId(),
      timestamp: partialContext.timestamp || now,
      relevantEntities: partialContext.relevantEntities || [],
      source: partialContext.source || 'conversation',
      conversationHistory: this.conversationManager.getHistory(),
      capabilities: Array.from(this.capabilities.values()), // TODO:
      workingMemory: this.workingMemory,
      config: this.config
    };
  }

  /**
   * Main reasoning and response pipeline
   */
  private async reasonAndRespond(content: string, context: AgentContext): Promise<AgentResponse> {
    const reasoningSteps: ReasoningStep[] = [];

    // Step 1: Analyze the input for context
    const analysisStep = await this.analyzeInput(content, context);
    reasoningSteps.push(analysisStep);

    // Step 2: Generate response with tool calling
    const responseStep = await this.generateResponse(analysisStep, context);
    reasoningSteps.push(responseStep);

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(reasoningSteps);

    return {
      content: responseStep.output.response,
      type: 'text',
      reasoning: reasoningSteps,
      capabilitiesUsed: [], // Will be tracked by tool calls
      metadata: {
        processingTime: reasoningSteps.reduce((sum, step) => sum + step.confidence, 0),
        confidence
      }
    };
  }

  /**
   * Analyze input content
   */
  private async analyzeInput(content: string, context: AgentContext): Promise<ReasoningStep> {
    // Generate embeddings for the query
    let queryEmbedding: Float32Array | undefined;
    try {
      const embeddingResult = await generateEmbeddings({
        provider: "ollama",
        model: "mxbai-embed-large:latest",
        input: content
      });
      queryEmbedding = new Float32Array(embeddingResult.embedding);
    } catch (error) {
      console.warn('Failed to generate query embeddings:', error);
      // Continue without embeddings
    }
    this.ensureInitialized();
    if (!this.memory) {
      return {
        id: this.generateId(),
        type: 'error',
        description: 'Memory instance is not initialized',
        input: content,
        output: null,
        confidence: 0,
        timestamp: new Date()
      };
    }

    // Query memory for related information
    const memoryResults = await queryMemory(this.memory, content, context, {
      maxResults: 10,
      maxDepth: 2,
      queryEmbedding
    });

    // Get contextual memories for better analysis
    let contextualMemories: any[] = [];
    try {
      const conversationHistory = context.conversationHistory.slice(-3);
      if (conversationHistory.length > 0) {
        contextualMemories = await getContextualMemories(
          this.memory,
          conversationHistory,
          3
        );
      }
    } catch (error) {
      console.warn('Failed to get contextual memories:', error);
    }

    // Find related clusters if clustering is enabled
    let relatedClusters: any[] = [];
    if (this.clusteringEnabled && queryEmbedding && this.clusters.length > 0) {
      try {
        relatedClusters = await findRelatedClusters(
          this.memory,
          queryEmbedding,
          this.clusters,
          3
        );
      } catch (error) {
        console.warn('Failed to find related clusters:', error);
      }
    }

    const analysis = {
      intent: this.classifyIntent(content),
      entities: memoryResults.entities || [],
      topics: this.extractTopics(content),
      complexity: this.assessComplexity(content),
      urgency: this.assessUrgency(content),
      relatedEntities: memoryResults.entities?.length || 0,
      semanticMatches: queryEmbedding ? memoryResults.entities?.length || 0 : 0,
      contextualMemories: contextualMemories.length,
      relatedClusters: relatedClusters.length,
      clusterThemes: relatedClusters.map(c => c.theme).slice(0, 2)
    };

    return {
      id: this.generateId(),
      type: 'analysis',
      description: 'Analyzed user input with semantic search, contextual memories, and clustering',
      input: content,
      output: analysis,
      confidence: 0.8,
      timestamp: new Date()
    };
  }

  /**
   * Execute a tool call
   */
  private async executeToolCall(toolCall: any): Promise<any> {
    let name: string;
    let args: any;

    if (toolCall.function) {
      name = toolCall.function.name;
      args = toolCall.function.arguments;
    } else {
      name = toolCall.tool;
      args = toolCall.args;
    }

    const executor = this.toolExecutors.get(name);
    if (!executor) {
      throw new Error(`No executor for tool ${name}`);
    }

    return await executor(args);
  }

  /**
   * Generate final response using LLM with tool calling loop
   */
  private async generateResponse(analysisStep: ReasoningStep, context: AgentContext): Promise<ReasoningStep> {
    const messages = this.buildConversationMessages(context, analysisStep);
    let finalResponse: string | null = null;
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const llmResponse = await generateText({
        provider: process.env.LLM_PROVIDER === 'lmstudio' ? 'lmstudio' : 'ollama',
        model: process.env.LLM_MODEL || 'qwen3:1.7b',
        promptOrMessages: messages as any,
        thinking: {
          isReasoningModel: true,
          logReasoning: false
        },
        stream: false,
        tools: getAllTools()
      });

      // Append the assistant message
      messages.push({
        role: 'assistant',
        content: llmResponse.reply
      });

      if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
        for (const toolCall of llmResponse.toolCalls) {
          try {
            console.log(`🔧 Executing tool: ${toolCall.tool ? (toolCall.tool as any).name : toolCall.tool}`);
            const result = await this.executeToolCall(toolCall);
            messages.push({
              role: 'tool',
              content: JSON.stringify(result),
              tool_call_id: this.generateId()
            } as any);
          } catch (error) {
            messages.push({
              role: 'tool',
              content: JSON.stringify({ error: (error as Error).message }),
              tool_call_id: this.generateId()
            } as any);
          }
        }
      } else {
        finalResponse = llmResponse.reply;
        break;
      }
    }

    if (!finalResponse) {
      finalResponse = 'Unable to generate response after maximum iterations.';
      console.log("!finalResponse: messages: ", messages);
    }

    return {
      id: this.generateId(),
      type: 'reflection',
      description: 'Generated response using LLM with tool calling loop',
      input: analysisStep.output,
      output: { response: finalResponse },
      confidence: 0.95,
      timestamp: new Date()
    };
  }

  /**
   * Register core capabilities
   */
  private registerCoreCapabilities(): void {
    // Register tool capabilities
    const toolCapabilities = getAllToolCapabilities();
    toolCapabilities.forEach(capability => {
      this.capabilities.set(capability.id, capability);
    });


    // Query memory capability
    this.capabilities.set('query_memory', {
      id: 'query_memory',
      name: 'Query Memory',
      description: 'Search the knowledge base for relevant information using dual graph architecture',
      execute: async (params: { content: string }, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };

        const result = await queryMemory(this.memory, params.content, context, {
          maxResults: 10,
          maxDepth: 2,
          useDualGraph: true, // Use dual graph querying
          includeMetadata: true
        });

        return {
          success: true,
          data: result,
          metadata: {
            executionTime: 100,
            confidence: 0.9,
            source: 'dual_graph_memory_system'
          }
        };
      }
    });

    // Create clusters capability
    this.capabilities.set('create_clusters', {
      id: 'create_clusters',
      name: 'Create Semantic Clusters',
      description: 'Group semantically similar memories into clusters',
      execute: async (params: any, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };
        const clusters = await createClusters(this.memory, {
          enabled: true,
          similarityThreshold: 0.7,
          maxClusters: 10,
          minClusterSize: 2,
          clusteringAlgorithm: 'kmeans'
        });

        this.clusters = clusters;
        this.lastClusteringUpdate = new Date();

        return {
          success: true,
          data: { clusters, count: clusters.length },
          metadata: {
            executionTime: 200,
            confidence: 0.95,
            source: 'clustering_system'
          }
        };
      }
    });

    // Dual graph statistics capability
    this.capabilities.set('get_dual_graph_stats', {
      id: 'get_dual_graph_stats',
      name: 'Get Dual Graph Statistics',
      description: 'Get comprehensive statistics about the dual graph memory system',
      execute: async (params: any, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };

        const stats = await getDualGraphStats(this.memory);

        return {
          success: true,
          data: stats,
          metadata: {
            executionTime: 50,
            confidence: 1.0,
            source: 'dual_graph_memory_system'
          }
        };
      }
    });

    // Find related clusters capability
    this.capabilities.set('find_related_clusters', {
      id: 'find_related_clusters',
      name: 'Find Related Clusters',
      description: 'Find memory clusters related to a query',
      execute: async (params: { query: string }, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };

        if (this.clusters.length === 0) {
          // Create clusters if none exist
          await this.capabilities.get('create_clusters')!.execute({}, context);
        }



        // Generate embedding for the query
        const embeddingResult = await generateEmbeddings({
          provider: "ollama",
          model: "mxbai-embed-large:latest",
          input: params.query
        });

        const relatedClusters = await findRelatedClusters(
          this.memory,
          new Float32Array(embeddingResult.embedding),
          this.clusters,
          5
        );

        return {
          success: true,
          data: { relatedClusters, count: relatedClusters.length },
          metadata: {
            executionTime: 150,
            confidence: 0.9,
            source: 'clustering_system'
          }
        };
      }
    });

    // Get contextual memories capability
    this.capabilities.set('get_contextual_memories', {
      id: 'get_contextual_memories',
      name: 'Get Contextual Memories',
      description: 'Retrieve memories relevant to current conversation',
      execute: async (params: any, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };

        const conversationHistory = context.conversationHistory.slice(-5); // Last 5 messages
        const contextualMemories = await getContextualMemories(
          this.memory,
          conversationHistory,
          5
        );

        return {
          success: true,
          data: { contextualMemories, count: contextualMemories.length },
          metadata: {
            executionTime: 100,
            confidence: 0.85,
            source: 'contextual_memory'
          }
        };
      }
    });

    // Analyze entities capability
    this.capabilities.set('analyze_entities', {
      id: 'analyze_entities',
      name: 'Analyze Entities',
      description: 'Extract and analyze entities from text',
      execute: async (params: { content: string }, context: AgentContext) => {
        this.ensureInitialized();
        if (!this.memory) return {
          success: false,
          error: 'Memory not initialized',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: 'memory_system'
          }
        };
        const result = await queryMemory(this.memory, params.content, context, {
          maxResults: 5,
          maxDepth: 1
        });

        return {
          success: true,
          data: {
            entities: result.entities || [],
            relationships: result.relationships || []
          },
          metadata: {
            executionTime: 50,
            confidence: 0.8,
            source: 'entity_analysis'
          }
        };
      }
    });

    // Plan task capability
    this.capabilities.set('plan_task', {
      id: 'plan_task',
      name: 'Plan Task',
      description: 'Create a plan for complex tasks',
      execute: async (params: { content: string }, context: AgentContext) => {
        // Simple planning logic
        const plan = {
          objective: params.content,
          steps: [
            'Analyze the request',
            'Break down into actionable items',
            'Execute the plan',
            'Review results'
          ]
        };

        return {
          success: true,
          data: plan,
          metadata: {
            executionTime: 75,
            confidence: 0.7,
            source: 'task_planner'
          }
        };
      }
    });
  }

  /**
   * Build conversation messages for LLM context
   */
  private buildConversationMessages(context: AgentContext, analysisStep: ReasoningStep): Array<{ role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string }> {
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];

    // System message with agent personality and context
    const systemMessage = this.buildSystemMessage(context);
    messages.push({ role: 'system', content: systemMessage });

    // Add recent conversation history (limited to prevent token overflow)
    const recentHistory = context.conversationHistory.slice(-10); // Last 10 messages

    for (const message of recentHistory) {
      if (message.role === 'user' || message.role === 'assistant') {
        messages.push({
          role: message.role,
          content: message.content
        });
      }
    }

    // Add current context and analysis results
    const contextMessage = this.buildContextMessage(context, analysisStep);
    if (contextMessage) {
      messages.push({ role: 'system', content: contextMessage });
    }

    return messages;
  }

  /**
   * Build system message with agent personality and instructions
   */
  private buildSystemMessage(context: AgentContext): string {
    const personality = context.config.personality;

    let systemMessage = `You are ${personality.name}, a ${personality.role}. `;

    if (personality.expertise && personality.expertise.length > 0) {
      systemMessage += `You specialize in: ${personality.expertise.join(', ')}. `;
    }

    systemMessage += `

Your capabilities include:
- Accessing and analyzing a knowledge graph of information
- Providing technical guidance and strategic advice
- Managing projects and breaking down complex tasks
- Learning from conversations and building context
- Communicating in a ${personality.communicationStyle} manner

Respond naturally and helpfully to the user's current message.`;

    return systemMessage;
  }

  /**
   * Build context message with analysis results
   */
  private buildContextMessage(context: AgentContext, analysisStep: ReasoningStep): string | null {
    const contextParts: string[] = [];

    const analysis = analysisStep.output;

    // Add intent and complexity analysis
    if (analysis.intent) {
      contextParts.push(`User intent appears to be: ${analysis.intent}`);
    }

    if (analysis.complexity) {
      contextParts.push(`Request complexity: ${analysis.complexity}`);
    }

    if (analysis.urgency) {
      contextParts.push(`Urgency level: ${analysis.urgency}`);
    }

    // Add topic analysis
    if (analysis.topics && analysis.topics.length > 0) {
      contextParts.push(`Detected topics: ${analysis.topics.join(', ')}`);
    }

    // Add entity analysis from memory
    if (analysis.entities && analysis.entities.length > 0) {
      contextParts.push(`Related entities from knowledge base: ${analysis.entities.slice(0, 5).map((e: any) => e.properties?.name || e.id).join(', ')}`);
    }

    if (analysis.relatedEntities > 0) {
      contextParts.push(`Found ${analysis.relatedEntities} related entities in the knowledge base`);
    }

    // Add clustering information
    if (analysis.relatedClusters > 0) {
      contextParts.push(`Found ${analysis.relatedClusters} related memory clusters`);
    }

    if (analysis.clusterThemes && analysis.clusterThemes.length > 0) {
      contextParts.push(`Relevant cluster themes: ${analysis.clusterThemes.join(', ')}`);
    }

    if (analysis.contextualMemories > 0) {
      contextParts.push(`Retrieved ${analysis.contextualMemories} contextual memories from conversation history`);
    }

    if (contextParts.length === 0) {
      return null;
    }

    return `Current analysis:\n${contextParts.join('\n')}`;
  }

  /**
   * Initialize the agent runtime
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing Agent Runtime with Dual Graph Memory...');

      // Initialize memory system with dual graph configuration
      this.memory = await createMemoryInstance({
        graph: {
          maxNodes: 10000,
          maxEdgesPerNode: 100,
          entityResolutionThreshold: 0.8
        },
        extraction: {
          entityConfidenceThreshold: 0.7,
          relationshipConfidenceThreshold: 0.6,
          maxEntitiesPerText: 50
        },
        memory: {
          maxMemoryNodes: 5000,
          evictionStrategy: 'lru',
          persistenceEnabled: false
        },
        dualGraph: {
          enabled: true, // Enable dual graph architecture
          lexical: {
            minChunkSize: 50,
            maxChunkSize: 1000,
            enableSentenceChunking: true,
            enableParagraphChunking: true,
            enableEmbeddings: true,
            enableLexicalRelations: true
          },
          domain: {
            enableHierarchies: true,
            enableTaxonomies: true,
            enableOrganizationalStructures: true,
            enableConceptClustering: true,
            minHierarchyConfidence: 0.7
          },
          linking: {
            enableEntityMentions: true,
            enableEvidenceSupport: true,
            enableSemanticGrounding: true,
            enableTemporalAlignment: true,
            minLinkConfidence: 0.6,
            maxLinksPerEntity: 10
          },
          processing: {
            enableParallelProcessing: false,
            enableProgressTracking: true,
            enableDetailedLogging: false
          }
        }
      });


      this.isInitialized = true;
      console.log('✅ Agent Runtime initialized successfully with Dual Graph Memory');

      // Initialize clustering
      await this.initializeClustering();

      // Populate tool executors
      for (const [name, executor] of Object.entries(TOOL_EXECUTORS)) {
        this.toolExecutors.set(name, executor);
      }

    } catch (error) {
      console.error('❌ Failed to initialize Agent Runtime:', error);
      throw new AgentError(
        AgentErrorType.CONFIGURATION_ERROR,
        'Failed to initialize agent runtime',
        'INIT_FAILED',
        error
      );
    }
  }


  /**
   * Helper methods
   */
  private async ensureInitialized(_?: unknown): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async storeInMemory(content: string, context: GraphContext): Promise<void> {
    this.ensureInitialized();
    if (!this.memory) return;

    try {
      // Generate embeddings for the content
      const embeddingResult = await generateEmbeddings({
        provider: "ollama",
        model: "mxbai-embed-large:latest",
        input: content
      });

      // Store in memory with dual graph extraction
      await addMemory(this.memory, content, context, {
        embeddings: embeddingResult.embedding,
        useDualGraph: true, // Use dual graph architecture
        enableProgressTracking: false // Disable for performance
      });
    } catch (error) {
      console.error('Error storing in memory:', error);
      // Fallback to text-only storage if embedding generation fails
      try {
        await addMemory(this.memory, content, context, {
          useDualGraph: true, // Still use dual graph even without embeddings
          enableProgressTracking: false
        });
      } catch (fallbackError) {
        console.error('Fallback memory storage also failed:', fallbackError);
      }
    }
  }

  private addToConversationHistory(role: 'user' | 'assistant' | 'system', content: string, context: GraphContext): void {
    const message: ConversationMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date(),
      metadata: {
        sessionId: context.sessionId,
        source: context.source
      }
    };

    this.conversationManager.addMessage(message);
  }

  private async generateAudioResponse(text: string): Promise<string> {
    try {
      return await textToSpeech(text);
    } catch (error) {
      console.error('Error generating audio:', error);
      return '';
    }
  }

  private classifyIntent(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why')) {
      return 'question';
    }

    if (lower.includes('please') || lower.includes('can you') || lower.includes('help me')) {
      return 'request';
    }

    return 'statement';
  }

  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const lower = content.toLowerCase();

    if (lower.includes('code') || lower.includes('programming') || lower.includes('development')) {
      topics.push('software_development');
    }

    if (lower.includes('project') || lower.includes('task') || lower.includes('work')) {
      topics.push('project_management');
    }

    if (lower.includes('team') || lower.includes('people') || lower.includes('meeting')) {
      topics.push('team_collaboration');
    }

    return topics;
  }

  private assessComplexity(content: string): 'low' | 'medium' | 'high' {
    const words = content.split(' ').length;

    if (words < 10) return 'low';
    if (words < 50) return 'medium';
    return 'high';
  }

  private assessUrgency(content: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const lower = content.toLowerCase();

    if (urgentWords.some(word => lower.includes(word))) {
      return 'high';
    }

    if (lower.includes('soon') || lower.includes('quickly')) {
      return 'medium';
    }

    return 'low';
  }

  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateOverallConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0;

    const weights = { observation: 0.2, analysis: 0.3, planning: 0.2, execution: 0.2, reflection: 0.1, error: 0 };
    let weightedSum = 0;
    let totalWeight = 0;

    for (const step of steps) {
      const weight = weights[step.type as keyof typeof weights] || 0.2;
      weightedSum += step.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private updateMetrics(processingTime: number, success: boolean): void {
    this.metricsTracker.updateMetrics(
      processingTime,
      success,
      this.conversationManager.getHistory().length,
      this.workingMemory.size
    );
  }

  /**
   * Get current agent metrics
   */
  getMetrics(): AgentMetrics {
    return this.metricsTracker.getMetrics();
  }

  /**
   * Get agent state for persistence
   */
  getState(): AgentState {
    return {
      config: this.config,
      conversationHistory: this.conversationManager.getHistory(),
      workingMemory: this.workingMemory,
      activePlans: [], // TODO: Implement plans
      metrics: this.metricsTracker.getMetrics(),
      lastUpdated: new Date()
    };
  }

  /**
   * Clear agent state
   */
  clear(): void {
    this.conversationManager.clear();
    this.workingMemory.clear();
    this.clusters = []; // Clear clusters too
    this.lastClusteringUpdate = new Date();
    // Note: Metrics are not cleared, as they track overall performance
    console.log('🧹 Agent state cleared');
  }
}
