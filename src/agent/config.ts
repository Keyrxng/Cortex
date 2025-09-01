import type { AgentConfig } from '../types';

/**
 * Default agent configuration
 */
export const DEFAULT_CONFIG: AgentConfig = {
  personality: {
    name: 'Uncle Bob',
    role: 'Personal Assistant & Technical Co-founder',
    expertise: [
      'software development',
      'system architecture',
      'project management',
      'technical strategy',
      'problem solving',
      'knowledge management'
    ],
    communicationStyle: 'professional'
  },
  memory: {
    maxConversationHistory: 50,
    maxWorkingMemoryItems: 100,
    memoryRetentionDays: 30
  },
  limits: {
    maxProcessingTime: 30000, // 30 seconds
    maxCapabilitiesPerRequest: 5,
    maxResponseLength: 2000
  },
  features: {
    enableReasoning: true,
    enablePlanning: true,
    enableLearning: true,
    enableMultiModal: true
  }
};
