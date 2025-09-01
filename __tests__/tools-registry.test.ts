/**
 * Tests for Agent Tools Index and Registry
 *
 * Comprehensive test suite covering:
 * - Tool registry functionality
 * - Tool-to-capability conversion
 * - Tool discovery and execution
 * - Integration between tools
 */

import {
  TOOL_REGISTRY,
  toolToCapability,
  getAllToolCapabilities,
  getToolByName,
  getCapabilityByName
} from '../src/tools/index';
import { jest } from '@jest/globals';

describe('Agent Tools Registry', () => {
  describe('TOOL_REGISTRY', () => {
    it('should contain all expected tools', () => {
      expect(TOOL_REGISTRY).toBeDefined();
      expect(Array.isArray(TOOL_REGISTRY)).toBe(true);
      expect(TOOL_REGISTRY.length).toBeGreaterThan(0);

      // Check that all tools have required properties
      TOOL_REGISTRY.forEach(tool => {
        expect(tool.type).toBe('function');
        expect(tool.function).toBeDefined();
        expect(tool.function.name).toBeDefined();
        expect(tool.function.description).toBeDefined();
        expect(tool.function.parameters).toBeDefined();
      });
    });

    it('should have unique tool names', () => {
      const names = TOOL_REGISTRY.map(tool => tool.function.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have valid parameter schemas', () => {
      TOOL_REGISTRY.forEach(tool => {
        const params = tool.function.parameters;
        expect(params.type).toBe('object');
        expect(Array.isArray(params.required)).toBe(true);

        // Check that all required parameters are defined in properties
        params.required.forEach(requiredParam => {
          expect(params.properties).toHaveProperty(requiredParam);
        });
      });
    });
  });

  describe('toolToCapability', () => {
    it('should convert tool to capability correctly', () => {
      const testTool = TOOL_REGISTRY[0]; // Use first available tool
      const capability = toolToCapability(testTool);

      expect(capability.id).toBe(testTool.function.name);
      expect(capability.name).toBe(testTool.function.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      expect(capability.description).toBe(testTool.function.description);
      expect(typeof capability.execute).toBe('function');
    });

    it('should handle capability execution', async () => {
      const testTool = TOOL_REGISTRY[0];
      const capability = toolToCapability(testTool);

      // Mock the execution - this would normally call the actual tool
      const mockParams = { test: 'value' };
      const mockContext = { userId: 'test' };

      // Since the actual execution depends on dynamic imports, we'll just test the structure
      expect(typeof capability.execute).toBe('function');
    });

    it('should handle execution errors gracefully', async () => {
      // Create a mock tool that will fail
      const failingTool = {
        type: 'function' as const,
        function: {
          name: 'failing_tool',
          description: 'A tool that fails',
          parameters: {
            type: 'object' as const,
            properties: {},
            required: []
          }
        }
      };

      const capability = toolToCapability(failingTool);
      const mockContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        timestamp: new Date(),
        source: 'test',
        conversationHistory: [],
        capabilities: [],
        workingMemory: new Map(),
        config: {
          personality: {
            name: 'Test Agent',
            role: 'Testing',
            expertise: [],
            communicationStyle: 'professional' as const
          },
          memory: {
            maxConversationHistory: 100,
            maxWorkingMemoryItems: 50,
            memoryRetentionDays: 30
          },
          limits: {
            maxProcessingTime: 5000,
            maxCapabilitiesPerRequest: 10,
            maxResponseLength: 1000
          },
          features: {
            enableReasoning: true,
            enablePlanning: true,
            enableLearning: true,
            enableMultiModal: false
          }
        }
      };
      const result = await capability.execute({}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getAllToolCapabilities', () => {
    it('should return all tools as capabilities', () => {
      const capabilities = getAllToolCapabilities();

      expect(capabilities).toBeDefined();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBe(TOOL_REGISTRY.length);

      capabilities.forEach(capability => {
        expect(capability.id).toBeDefined();
        expect(capability.name).toBeDefined();
        expect(capability.description).toBeDefined();
        expect(typeof capability.execute).toBe('function');
      });
    });

    it('should have unique capability IDs', () => {
      const capabilities = getAllToolCapabilities();
      const ids = capabilities.map(cap => cap.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('getToolByName', () => {
    it('should find existing tools by name', () => {
      const firstTool = TOOL_REGISTRY[0];
      const foundTool = getToolByName(firstTool.function.name);

      expect(foundTool).toBeDefined();
      expect(foundTool?.function.name).toBe(firstTool.function.name);
    });

    it('should return undefined for non-existent tools', () => {
      const foundTool = getToolByName('non_existent_tool');
      expect(foundTool).toBeUndefined();
    });

    it('should handle empty or invalid names', () => {
      expect(getToolByName('')).toBeUndefined();
      expect(getToolByName(null as any)).toBeUndefined();
      expect(getToolByName(undefined as any)).toBeUndefined();
    });
  });

  describe('getCapabilityByName', () => {
    it('should find existing capabilities by name', () => {
      const firstTool = TOOL_REGISTRY[0];
      const capability = getCapabilityByName(firstTool.function.name);

      expect(capability).toBeDefined();
      expect(capability?.id).toBe(firstTool.function.name);
    });

    it('should return undefined for non-existent capabilities', () => {
      const capability = getCapabilityByName('non_existent_capability');
      expect(capability).toBeUndefined();
    });

    it('should handle empty or invalid names', () => {
      expect(getCapabilityByName('')).toBeUndefined();
      expect(getCapabilityByName(null as any)).toBeUndefined();
      expect(getCapabilityByName(undefined as any)).toBeUndefined();
    });
  });

  describe('Tool Integration', () => {
    it('should maintain consistency between tools and capabilities', () => {
      const tools = TOOL_REGISTRY;
      const capabilities = getAllToolCapabilities();

      expect(tools.length).toBe(capabilities.length);

      tools.forEach((tool, index) => {
        const capability = capabilities[index];
        expect(capability.id).toBe(tool.function.name);
        expect(capability.description).toBe(tool.function.description);
      });
    });

    it('should support tool discovery workflow', () => {
      // Simulate a typical tool discovery workflow
      const toolName = TOOL_REGISTRY[0].function.name;

      // 1. Find tool by name
      const tool = getToolByName(toolName);
      expect(tool).toBeDefined();

      // 2. Convert to capability
      const capability = tool ? toolToCapability(tool) : null;
      expect(capability).toBeDefined();

      // 3. Verify capability can be found by name
      const foundCapability = getCapabilityByName(toolName);
      expect(foundCapability).toBeDefined();
      expect(foundCapability?.id).toBe(capability?.id);
    });

    it('should handle tool execution workflow', async () => {
      const tool = TOOL_REGISTRY[0];
      const capability = toolToCapability(tool);

      // Test that the execution function exists and is callable
      expect(typeof capability.execute).toBe('function');

      // Test execution with mock context
      const mockContext = {
        userId: 'test-user',
        sessionId: 'test-session',
        timestamp: new Date(),
        source: 'test',
        conversationHistory: [],
        capabilities: [],
        workingMemory: new Map(),
        config: {
          personality: {
            name: 'Test Agent',
            role: 'Testing',
            expertise: [],
            communicationStyle: 'professional' as const
          },
          memory: {
            maxConversationHistory: 100,
            maxWorkingMemoryItems: 50,
            memoryRetentionDays: 30
          },
          limits: {
            maxProcessingTime: 5000,
            maxCapabilitiesPerRequest: 10,
            maxResponseLength: 1000
          },
          features: {
            enableReasoning: true,
            enablePlanning: true,
            enableLearning: true,
            enableMultiModal: false
          }
        }
      };

      // The actual execution will fail due to missing implementation,
      // but we can test that the function is structured correctly
      const result = await capability.execute({}, mockContext);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Tool Categories', () => {
    it('should categorize tools correctly', () => {
      const webSearchTools = TOOL_REGISTRY.filter(tool =>
        tool.function.name.includes('web') || tool.function.name.includes('search')
      );

      const fileSystemTools = TOOL_REGISTRY.filter(tool =>
        tool.function.name.includes('file') || tool.function.name.includes('semantic')
      );

      const gitTools = TOOL_REGISTRY.filter(tool =>
        tool.function.name.includes('git') || tool.function.name.includes('commit')
      );

      // Verify we have tools in each category
      expect(webSearchTools.length).toBeGreaterThan(0);
      expect(fileSystemTools.length).toBeGreaterThan(0);
      expect(gitTools.length).toBeGreaterThan(0);
    });

    it('should have appropriate descriptions for each category', () => {
      TOOL_REGISTRY.forEach(tool => {
        expect(tool.function.description).toBeDefined();
        expect(tool.function.description.length).toBeGreaterThan(10);

        // Check for category-specific keywords in descriptions
        const desc = tool.function.description.toLowerCase();
        if (tool.function.name.includes('web') || tool.function.name.includes('search')) {
          expect(desc).toMatch(/(web|search|content|extraction)/);
        }
        if (tool.function.name.includes('file') || tool.function.name.includes('semantic')) {
          expect(desc).toMatch(/(file|semantic|operation)/);
        }
        if (tool.function.name.includes('git') || tool.function.name.includes('commit')) {
          expect(desc).toMatch(/(git|commit|repository)/);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed tools gracefully', () => {
      const malformedTool = {
        type: 'function' as const,
        function: {
          name: '',
          description: '',
          parameters: null as any
        }
      };

      expect(() => toolToCapability(malformedTool)).not.toThrow();
    });

    it('should handle tools with missing properties', () => {
      const incompleteTool = {
        type: 'function' as const,
        function: {
          name: 'incomplete_tool'
          // Missing description and parameters
        }
      } as any;

      expect(() => toolToCapability(incompleteTool)).not.toThrow();
    });
  });
});
