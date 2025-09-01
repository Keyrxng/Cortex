import type { AgentMetrics } from '../types';

/**
 * Tracks agent metrics
 */
export class MetricsTracker {
  private metrics: AgentMetrics;

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): AgentMetrics {
    return {
      totalRequests: 0,
      averageProcessingTime: 0,
      successRate: 1.0,
      capabilityUsage: new Map(),
      memoryUsage: {
        conversationHistory: 0,
        workingMemory: 0,
        total: 0
      },
      errors: {
        total: 0,
        byType: new Map()
      }
    };
  }

  updateMetrics(processingTime: number, success: boolean, conversationLength: number, workingMemorySize: number): void {
    this.metrics.totalRequests++;

    // Update processing time (rolling average)
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageProcessingTime =
      alpha * processingTime + (1 - alpha) * this.metrics.averageProcessingTime;

    // Update success rate
    const successCount = success ? 1 : 0;
    this.metrics.successRate =
      (this.metrics.successRate * (this.metrics.totalRequests - 1) + successCount) / this.metrics.totalRequests;

    // Update memory usage
    this.metrics.memoryUsage.conversationHistory = conversationLength;
    this.metrics.memoryUsage.workingMemory = workingMemorySize;
    this.metrics.memoryUsage.total = this.metrics.memoryUsage.conversationHistory + this.metrics.memoryUsage.workingMemory;
  }

  getMetrics(): AgentMetrics {
    return { ...this.metrics };
  }
}
