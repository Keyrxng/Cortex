/**
 * Jest setup file for agentic-agent tests
 * Configures MSW for API mocking and test utilities
 */

import { jest } from '@jest/globals';

// Extend global interface
declare global {
  var testUtils: {
    wait: (ms: number) => Promise<void>;
    createMockFile: (path: string, content?: string) => any;
    createMockDirectory: (path: string, children?: any[]) => any;
    randomString: (length?: number) => string;
    randomId: () => string;
    createTestContext: () => any;
  };
}

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep log and warn for debugging, but suppress info
  info: jest.fn(),
  debug: jest.fn(),
};

// Set up test environment variables
process.env.NODE_ENV = 'test';

// Global test utilities
global.testUtils = {
  // Helper to create test timeouts
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock file system entries
  createMockFile: (path: string, content: string = '') => ({
    path,
    content,
    isFile: () => true,
    isDirectory: () => false
  }),

  createMockDirectory: (path: string, children: any[] = []) => ({
    path,
    children,
    isFile: () => false,
    isDirectory: () => true
  }),

  // Helper to generate random test data
  randomString: (length: number = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  randomId: () => Math.random().toString(36).substring(2, 15),

  // Helper to create test context
  createTestContext: () => ({
    userId: 'test-user',
    sessionId: 'test-session',
    timestamp: new Date(),
    source: 'test'
  })
};
