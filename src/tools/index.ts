/**
 * Agent Tools Index
 *
 * Central registry for all agent tools and capabilities.
 * Exports tool schemas and execution functions for integration with the agent runtime.
 */

import type { AgentTool, AgentCapability } from '../types.js';

// Web Search Tools
import {
  agenticWebSearchTool,
  extractWebContentTool,
  monitorWebChangesTool,
  executeAgenticWebSearch,
  executeExtractWebContent,
  executeMonitorWebChanges,
  webSearch,
  crawlPage,
  SEARCH_USER_AGENTS
} from './web-search';

// File System Tools
import {
  searchFilesTool,
  createFileTool,
  readFileTool,
  modifyFileTool,
  listDirectoryTool,
  deleteFileTool,
  moveFileTool,
  copyFileTool,
  executeSearchFiles,
  executeCreateFile,
  executeReadFile,
  executeModifyFile,
  executeListDirectory,
  executeDeleteFile,
  executeMoveFile,
  executeCopyFile
} from './file-system';

// Git Operations Tools
import {
  smartGitOperationsTool,
  automatedCodeReviewTool,
  executeSmartGitOperations,
  executeAutomatedCodeReview
} from './git-operations';

// Re-export for external use
export {
  agenticWebSearchTool,
  extractWebContentTool,
  monitorWebChangesTool,
  executeAgenticWebSearch,
  executeExtractWebContent,
  executeMonitorWebChanges,
  webSearch,
  crawlPage,
  SEARCH_USER_AGENTS,
  searchFilesTool,
  createFileTool,
  readFileTool,
  modifyFileTool,
  listDirectoryTool,
  deleteFileTool,
  moveFileTool,
  copyFileTool,
  executeSearchFiles,
  executeCreateFile,
  executeReadFile,
  executeModifyFile,
  executeListDirectory,
  executeDeleteFile,
  executeMoveFile,
  executeCopyFile,
  smartGitOperationsTool,
  automatedCodeReviewTool,
  executeSmartGitOperations,
  executeAutomatedCodeReview
};

// Tool Registry
export const TOOL_REGISTRY: AgentTool[] = [
  // Web Search Tools
  agenticWebSearchTool,
  extractWebContentTool,
  monitorWebChangesTool,
  // File System Tools
  searchFilesTool,
  createFileTool,
  readFileTool,
  modifyFileTool,
  listDirectoryTool,
  deleteFileTool,
  moveFileTool,
  copyFileTool,
  // Git Operations Tools
  smartGitOperationsTool,
  automatedCodeReviewTool,
];

// Tool Executors Map
export const TOOL_EXECUTORS: Record<string, (args: any) => Promise<any>> = {
  search_files: executeSearchFiles,
  create_file: executeCreateFile,
  read_file: executeReadFile,
  modify_file: executeModifyFile,
  list_directory: executeListDirectory,
  delete_file: executeDeleteFile,
  move_file: executeMoveFile,
  copy_file: executeCopyFile,
  agentic_web_search: executeAgenticWebSearch,
  extract_web_content: executeExtractWebContent,
  monitor_web_changes: executeMonitorWebChanges,
  smart_git_operations: executeSmartGitOperations,
  automated_code_review: executeAutomatedCodeReview,
};

/**
 * Convert AgentTool to AgentCapability
 * This allows tools to be registered as capabilities in the agent runtime
 */
export function toolToCapability(tool: AgentTool): AgentCapability {
  return {
    id: tool.function.name,
    name: tool.function.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: tool.function.description,
    execute: async (params: any, context: any) => {
      try {
        // Import the execution function dynamically
        const module = await import(`./${tool.function.name.split('_')[0]}-search.js`);
        const executeFunction = module[`execute${tool.function.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, '')}`];

        if (!executeFunction) {
          throw new Error(`Execution function not found for tool: ${tool.function.name}`);
        }

        const result = await executeFunction(params);
        return result;
      } catch (error) {
        console.error(`Error executing tool ${tool.function.name}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionTime: 0,
            confidence: 0,
            source: tool.function.name
          }
        };
      }
    }
  };
}

/**
 * Get all tools as capabilities
 */
export function getAllTools() {
  return TOOL_REGISTRY
}

export function getAllToolCapabilities(): AgentCapability[] {
  return TOOL_REGISTRY.map(tool => toolToCapability(tool));
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): AgentTool | undefined {
  return TOOL_REGISTRY.find(tool => tool.function.name === name);
}

/**
 * Get capability by name
 */
export function getCapabilityByName(name: string): AgentCapability | undefined {
  const tool = getToolByName(name);
  return tool ? toolToCapability(tool) : undefined;
}