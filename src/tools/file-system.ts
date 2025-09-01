/**
 * File System Tools
 *
 * Implements direct file system operations for the agentic agent system.
 * Provides clear, structured operations that the LLM can call with precise parameters.
 */

import { promises as fs } from 'fs';
import { join, dirname, extname, basename } from 'path';
import type { AgentTool, ParameterDefinition } from '../types.js';

/**
 * Search Files Tool Schema
 * Searches for files using glob patterns and content filters
 */
export const searchFilesTool: AgentTool = {
  type: "function",
  function: {
    name: "search_files",
    description: "Search for files in a directory using patterns and content filters",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path to search in"
        },
        pattern: {
          type: "string",
          description: "Glob pattern to match files (e.g., '*.ts', 'src/**/*.js')"
        },
        content_filter: {
          type: "string",
          description: "Text to search for within files"
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return"
        }
      },
      required: ["path"]
    }
  }
};

/**
 * Create File Tool Schema
 * Creates a new file with specified content
 */
export const createFileTool: AgentTool = {
  type: "function",
  function: {
    name: "create_file",
    description: "Create a new file with specified content",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Full path for the new file"
        },
        content: {
          type: "string",
          description: "Content to write to the file"
        }
      },
      required: ["path", "content"]
    }
  }
};

/**
 * Read File Tool Schema
 * Reads the content of a file
 */
export const readFileTool: AgentTool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Read the content of a file",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to read"
        },
        start_line: {
          type: "number",
          description: "Starting line number (1-indexed)"
        },
        end_line: {
          type: "number",
          description: "Ending line number (1-indexed)"
        }
      },
      required: ["path"]
    }
  }
};

/**
 * Modify File Tool Schema
 * Modifies an existing file
 */
export const modifyFileTool: AgentTool = {
  type: "function",
  function: {
    name: "modify_file",
    description: "Modify an existing file by replacing content",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to modify"
        },
        old_content: {
          type: "string",
          description: "Content to replace (use exact string match)"
        },
        new_content: {
          type: "string",
          description: "New content to insert"
        },
        backup: {
          type: "boolean",
          description: "Create backup before modifying"
        }
      },
      required: ["path", "old_content", "new_content"]
    }
  }
};

/**
 * List Directory Tool Schema
 * Lists contents of a directory
 */
export const listDirectoryTool: AgentTool = {
  type: "function",
  function: {
    name: "list_directory",
    description: "List contents of a directory",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path to list"
        },
        recursive: {
          type: "boolean",
          description: "Include subdirectories recursively"
        }
      },
      required: ["path"]
    }
  }
};

/**
 * Delete File Tool Schema
 * Deletes a file or directory
 */
export const deleteFileTool: AgentTool = {
  type: "function",
  function: {
    name: "delete_file",
    description: "Delete a file or directory",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to delete"
        },
        recursive: {
          type: "boolean",
          description: "Delete directories recursively"
        }
      },
      required: ["path"]
    }
  }
};

/**
 * Move/Rename Tool Schema
 * Moves or renames files/directories
 */
export const moveFileTool: AgentTool = {
  type: "function",
  function: {
    name: "move_file",
    description: "Move or rename a file or directory",
    parameters: {
      type: "object",
      properties: {
        source_path: {
          type: "string",
          description: "Source path"
        },
        destination_path: {
          type: "string",
          description: "Destination path"
        }
      },
      required: ["source_path", "destination_path"]
    }
  }
};

/**
 * Copy File Tool Schema
 * Copies files/directories
 */
export const copyFileTool: AgentTool = {
  type: "function",
  function: {
    name: "copy_file",
    description: "Copy a file or directory",
    parameters: {
      type: "object",
      properties: {
        source_path: {
          type: "string",
          description: "Source path"
        },
        destination_path: {
          type: "string",
          description: "Destination path"
        },
        recursive: {
          type: "boolean",
          description: "Copy directories recursively"
        }
      },
      required: ["source_path", "destination_path"]
    }
  }
};

/**
 * Execute Search Files
 */
export async function executeSearchFiles(params: {
  path: string;
  pattern?: string;
  content_filter?: string;
  max_results?: number;
}): Promise<any> {
  const { path, pattern = '*', content_filter, max_results = 10 } = params;

  try {
    const results = await findFiles(path, pattern, content_filter, max_results);

    return {
      success: true,
      data: {
        files: results,
        total_found: results.length
      },
      metadata: {
        executionTime: 200,
        confidence: 0.95,
        source: 'search_files'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'search_files'
      }
    };
  }
}

/**
 * Execute Create File
 */
export async function executeCreateFile(params: {
  path: string;
  content: string;
}): Promise<any> {
  const { path: filePath, content } = params;

  try {
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      data: {
        created_file: filePath,
        content_length: content.length
      },
      metadata: {
        executionTime: 100,
        confidence: 0.95,
        source: 'create_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Create failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'create_file'
      }
    };
  }
}

/**
 * Execute Read File
 */
export async function executeReadFile(params: {
  path: string;
  start_line?: number;
  end_line?: number;
}): Promise<any> {
  const { path: filePath, start_line, end_line } = params;

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    let resultContent = content;
    if (start_line && end_line) {
      resultContent = lines.slice(start_line - 1, end_line).join('\n');
    } else if (start_line) {
      resultContent = lines.slice(start_line - 1).join('\n');
    }

    return {
      success: true,
      data: {
        path: filePath,
        content: resultContent,
        total_lines: lines.length,
        returned_lines: resultContent.split('\n').length
      },
      metadata: {
        executionTime: 50,
        confidence: 0.95,
        source: 'read_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Read failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'read_file'
      }
    };
  }
}

/**
 * Execute Modify File
 */
export async function executeModifyFile(params: {
  path: string;
  old_content: string;
  new_content: string;
  backup?: boolean;
}): Promise<any> {
  const { path: filePath, old_content, new_content, backup = true } = params;

  try {
    const currentContent = await fs.readFile(filePath, 'utf-8');

    if (!currentContent.includes(old_content)) {
      throw new Error('Old content not found in file');
    }

    if (backup) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, currentContent, 'utf-8');
    }

    const newFileContent = currentContent.replace(old_content, new_content);
    await fs.writeFile(filePath, newFileContent, 'utf-8');

    return {
      success: true,
      data: {
        modified_file: filePath,
        backup_created: backup,
        changes_made: 1
      },
      metadata: {
        executionTime: 100,
        confidence: 0.9,
        source: 'modify_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Modify failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'modify_file'
      }
    };
  }
}

/**
 * Execute List Directory
 */
export async function executeListDirectory(params: {
  path: string;
  recursive?: boolean;
}): Promise<any> {
  const { path: dirPath, recursive = false } = params;

  try {
    if (recursive) {
      const items = await listDirectoryRecursive(dirPath);
      const result = items.map(item => ({
        name: item.replace(/\/$/, ''), // Remove trailing slash for directories
        path: join(dirPath, item.replace(/\/$/, '')),
        type: item.endsWith('/') ? 'directory' : 'file'
      }));

      return {
        success: true,
        data: {
          directory: dirPath,
          items: result,
          total_items: result.length
        },
        metadata: {
          executionTime: 50,
          confidence: 0.95,
          source: 'list_directory'
        }
      };
    } else {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      const result = items.map(item => ({
        name: item.name,
        path: join(dirPath, item.name),
        type: item.isDirectory() ? 'directory' : 'file'
      }));

      return {
        success: true,
        data: {
          directory: dirPath,
          items: result,
          total_items: result.length
        },
        metadata: {
          executionTime: 50,
          confidence: 0.95,
          source: 'list_directory'
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'List failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'list_directory'
      }
    };
  }
}

/**
 * Execute Delete File
 */
export async function executeDeleteFile(params: {
  path: string;
  recursive?: boolean;
}): Promise<any> {
  const { path: filePath, recursive = false } = params;

  try {
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      if (recursive) {
        await fs.rm(filePath, { recursive: true });
      } else {
        await fs.rmdir(filePath);
      }
    } else {
      await fs.unlink(filePath);
    }

    return {
      success: true,
      data: {
        deleted_path: filePath,
        type: stats.isDirectory() ? 'directory' : 'file'
      },
      metadata: {
        executionTime: 50,
        confidence: 0.95,
        source: 'delete_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'delete_file'
      }
    };
  }
}

/**
 * Execute Move File
 */
export async function executeMoveFile(params: {
  source_path: string;
  destination_path: string;
}): Promise<any> {
  const { source_path, destination_path } = params;

  try {
    await fs.mkdir(dirname(destination_path), { recursive: true });
    await fs.rename(source_path, destination_path);

    return {
      success: true,
      data: {
        moved_from: source_path,
        moved_to: destination_path
      },
      metadata: {
        executionTime: 100,
        confidence: 0.95,
        source: 'move_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Move failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'move_file'
      }
    };
  }
}

/**
 * Execute Copy File
 */
export async function executeCopyFile(params: {
  source_path: string;
  destination_path: string;
  recursive?: boolean;
}): Promise<any> {
  const { source_path, destination_path, recursive = true } = params;

  try {
    await fs.mkdir(dirname(destination_path), { recursive: true });
    await fs.cp(source_path, destination_path, { recursive });

    return {
      success: true,
      data: {
        copied_from: source_path,
        copied_to: destination_path
      },
      metadata: {
        executionTime: 150,
        confidence: 0.95,
        source: 'copy_file'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Copy failed',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'copy_file'
      }
    };
  }
}

// Utility functions

async function findFiles(basePath: string, pattern: string, contentFilter?: string, maxResults?: number): Promise<Array<{path: string; size: number; modified: Date}>> {
  const results: Array<{path: string; size: number; modified: Date}> = [];

  async function search(dir: string): Promise<void> {
    if (maxResults && results.length >= maxResults) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (maxResults && results.length >= maxResults) return;

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await search(fullPath);
          }
        } else if (entry.isFile()) {
          if (matchesPattern(entry.name, pattern)) {
            const stats = await fs.stat(fullPath);

            if (!contentFilter || await containsText(fullPath, contentFilter)) {
              results.push({
                path: fullPath,
                size: stats.size,
                modified: stats.mtime
              });
            }
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await search(basePath);
  return results;
}

function matchesPattern(filename: string, pattern: string): boolean {
  // Simple glob matching - could be enhanced with a proper glob library
  if (pattern === '*') return true;
  if (pattern.startsWith('*.')) {
    return filename.endsWith(pattern.slice(1));
  }
  return filename.includes(pattern.replace('*', ''));
}

async function containsText(filePath: string, text: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.toLowerCase().includes(text.toLowerCase());
  } catch {
    return false;
  }
}

async function listDirectoryRecursive(dirPath: string): Promise<string[]> {
  const results: string[] = [];

  async function list(dir: string, prefix = ''): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const displayPath = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          results.push(displayPath + '/');
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await list(fullPath, displayPath);
          }
        } else {
          results.push(displayPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  await list(dirPath);
  return results;
}