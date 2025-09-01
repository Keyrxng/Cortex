/**
 * Core type definitions for the Agentic Agent System
 *
 * This module defines the fundamental data structures used throughout the agentic system,
 * following the 12-factor agent principles and architectural patterns from agentic-memory.
 *
 * Key Principles:
 * - Stateless operations with explicit context passing
 * - Memory-bounded processing with configurable limits
 * - Comprehensive error handling and logging
 * - Extensible architecture for new capabilities
 */

export interface AgentTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ParameterDefinition>;
      required: string[];
    };
  };
}

export interface ParameterDefinition {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: ParameterDefinition;
  properties?: Record<string, ParameterDefinition>;
}

/**
 * Context information for agent operations
 * Follows 12-factor agent principles with explicit context passing
 */
export interface GraphContext {
  /** User identifier for multi-tenant scenarios */
  userId: string;
  /** Session identifier for conversation tracking */
  sessionId: string;
  /** Operation timestamp */
  timestamp: Date;
  /** Currently relevant entities for context-aware operations */
  relevantEntities?: string[];
  /** Source of the information (e.g., 'conversation', 'document', 'inference') */
  source?: string;
}

/**
 * Agent capabilities and tools
 */
export interface AgentCapability {
  /** Unique capability identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this capability does */
  description: string;
  /** Function to execute the capability */
  execute: (params: any, context: AgentContext) => Promise<CapabilityResult>;
  /** Schema for capability parameters */
  parameterSchema?: any;
}

/**
 * Result of executing a capability
 */
export interface CapabilityResult {
  /** Whether the execution was successful */
  success: boolean;
  /** Result data */
  data?: any;
  /** Error information if failed */
  error?: string;
  /** Processing metadata */
  metadata: {
    executionTime: number;
    confidence?: number;
    source?: string;
  };
}

/**
 * Agent context for operations
 * Extends GraphContext with agent-specific information
 */
export interface AgentContext extends GraphContext {
  /** Current conversation history */
  conversationHistory: ConversationMessage[];
  /** Available capabilities */
  capabilities: AgentCapability[];
  /** Current working memory */
  workingMemory: Map<string, any>;
  /** Agent configuration */
  config: AgentConfig;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  /** Message ID */
  id: string;
  /** Role (user, assistant, system) */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date;
  /** Associated metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent personality and behavior settings */
  personality: {
    name: string;
    role: string;
    expertise: string[];
    communicationStyle: 'professional' | 'casual' | 'technical';
  };

  /** Memory management settings */
  memory: {
    maxConversationHistory: number;
    maxWorkingMemoryItems: number;
    memoryRetentionDays: number;
  };

  /** Processing limits */
  limits: {
    maxProcessingTime: number;
    maxCapabilitiesPerRequest: number;
    maxResponseLength: number;
  };

  /** Feature flags */
  features: {
    enableReasoning: boolean;
    enablePlanning: boolean;
    enableLearning: boolean;
    enableMultiModal: boolean;
  };
}

/**
 * Agent reasoning step
 */
export interface ReasoningStep {
  /** Step identifier */
  id: string;
  /** Step type */
  type: 'observation' | 'analysis' | 'planning' | 'execution' | 'reflection' | 'error';
  /** Step description */
  description: string;
  /** Input data for this step */
  input: any;
  /** Output data from this step */
  output: any;
  /** Confidence score */
  confidence: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Agent plan for complex tasks
 */
export interface AgentPlan {
  /** Plan identifier */
  id: string;
  /** Plan objective */
  objective: string;
  /** Steps to accomplish the objective */
  steps: PlanStep[];
  /** Current step index */
  currentStep: number;
  /** Plan status */
  status: 'planning' | 'executing' | 'completed' | 'failed';
  /** Plan metadata */
  metadata: {
    createdAt: Date;
    estimatedCompletion: Date;
    priority: 'low' | 'medium' | 'high';
  };
}

/**
 * Individual step in an agent plan
 */
export interface PlanStep {
  /** Step identifier */
  id: string;
  /** Step description */
  description: string;
  /** Required capabilities */
  requiredCapabilities: string[];
  /** Step parameters */
  parameters: any;
  /** Step status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  /** Dependencies (other step IDs) */
  dependencies: string[];
}

/**
 * Agent response
 */
export interface AgentResponse {
  /** Response content */
  content: string;
  /** Response type */
  type: 'text' | 'audio' | 'mixed';
  /** Audio file path if applicable */
  audioPath?: string;
  /** Reasoning steps taken */
  reasoning?: ReasoningStep[];
  /** Capabilities used */
  capabilitiesUsed?: string[];
  /** Metadata */
  metadata: {
    processingTime: number;
    confidence: number;
    tokensUsed?: number;
  };
}

/**
 * Agent metrics for monitoring
 */
export interface AgentMetrics {
  /** Total requests processed */
  totalRequests: number;
  /** Average processing time */
  averageProcessingTime: number;
  /** Success rate */
  successRate: number;
  /** Capability usage statistics */
  capabilityUsage: Map<string, number>;
  /** Memory usage */
  memoryUsage: {
    conversationHistory: number;
    workingMemory: number;
    total: number;
  };
  /** Error statistics */
  errors: {
    total: number;
    byType: Map<string, number>;
  };
}

/**
 * Agent state for persistence
 */
export interface AgentState {
  /** Agent configuration */
  config: AgentConfig;
  /** Current conversation history */
  conversationHistory: ConversationMessage[];
  /** Working memory */
  workingMemory: Map<string, any>;
  /** Active plans */
  activePlans: AgentPlan[];
  /** Metrics */
  metrics: AgentMetrics;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Error types for the agent system
 */
export enum AgentErrorType {
  CONFIGURATION_ERROR = 'configuration_error',
  CAPABILITY_ERROR = 'capability_error',
  MEMORY_ERROR = 'memory_error',
  PROCESSING_ERROR = 'processing_error',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error'
}

/**
 * Agent error with detailed information
 */
export class AgentError extends Error {
  public readonly type: AgentErrorType;
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    type: AgentErrorType,
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: any
  ) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.name = 'AgentError';
  }
}


