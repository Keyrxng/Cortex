import type { ConversationMessage } from '../types';

/**
 * Manages conversation history with size limits
 */
export class ConversationManager {
  private history: ConversationMessage[] = [];
  private maxHistory: number;

  constructor(maxHistory: number) {
    this.maxHistory = maxHistory;
  }

  addMessage(message: ConversationMessage): void {
    this.history.push(message);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  getHistory(): ConversationMessage[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }
}
