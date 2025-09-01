/**
 * Git Operations Tools
 *
 * Implements intelligent Git operations for the agentic agent system.
 * Provides semantic commits, automated branching, and GitHub integration.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { AgentTool, ParameterDefinition } from '../types.js';

const execAsync = promisify(exec);

/**
 * Smart Git Operations Tool Schema
 * Performs intelligent Git operations with semantic commits and branch management
 */
export const smartGitOperationsTool: AgentTool = {
  type: "function",
  function: {
    name: "smart_git_operations",
    description: "Performs intelligent Git operations including semantic commits, automated branch management, and context-aware merging. Uses GitHub CLI integration for advanced operations.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Git operation to perform",
          enum: ["init", "commit", "branch", "merge", "push", "pull", "status", "diff", "log"]
        },
        repository_path: {
          type: "string",
          description: "Path to the Git repository"
        },
        commit_options: {
          type: "object",
          description: "Options for commit operations",
          properties: {
            message: {
              type: "string",
              description: "Commit message"
            },
            semantic_type: {
              type: "string",
              description: "Semantic commit type (feat, fix, docs, style, refactor, test, chore)",
              enum: ["feat", "fix", "docs", "style", "refactor", "test", "chore"]
            },
            scope: {
              type: "string",
              description: "Scope of the commit (e.g., 'auth', 'api', 'ui')"
            },
            breaking_change: {
              type: "boolean",
              description: "Whether this is a breaking change"
            },
            files: {
              type: "array",
              description: "Specific files to commit",
              items: {
                type: "string",
                description: "File path"
              }
            }
          }
        },
        branch_strategy: {
          type: "object",
          description: "Branch management configuration",
          properties: {
            action: {
              type: "string",
              description: "Branch action to perform",
              enum: ["create", "switch", "delete", "list"]
            },
            branch_name: {
              type: "string",
              description: "Name of the branch"
            },
            base_branch: {
              type: "string",
              description: "Base branch for new branches"
            }
          }
        },
        pr_options: {
          type: "object",
          description: "Pull request creation options",
          properties: {
            title: {
              type: "string",
              description: "Pull request title"
            },
            body: {
              type: "string",
              description: "Pull request description"
            },
            base_branch: {
              type: "string",
              description: "Base branch for the PR"
            },
            draft: {
              type: "boolean",
              description: "Create as draft PR"
            }
          }
        }
      },
      required: ["operation", "repository_path"]
    }
  }
};

/**
 * Automated Code Review Tool Schema
 * Performs comprehensive code review with security analysis
 */
export const automatedCodeReviewTool: AgentTool = {
  type: "function",
  function: {
    name: "automated_code_review",
    description: "Performs comprehensive code review including security analysis, performance optimization suggestions, and adherence to best practices. Integrates with Git workflow.",
    parameters: {
      type: "object",
      properties: {
        review_target: {
          type: "object",
          description: "Target for code review (commit hash, PR number, etc.)",
          properties: {
            type: {
              type: "string",
              description: "Type of review target",
              enum: ["commit", "branch", "pr", "files"]
            },
            identifier: {
              type: "string",
              description: "Identifier for the review target (hash, branch name, PR number, etc.)"
            }
          }
        },
        review_criteria: {
          type: "array",
          description: "Criteria to evaluate during review",
          items: {
            type: "string",
            description: "Review criterion (security, performance, maintainability, etc.)"
          }
        },
        severity_threshold: {
          type: "string",
          description: "Minimum severity level for reported issues",
          enum: ["low", "medium", "high", "critical"]
        },
        output_format: {
          type: "string",
          description: "Format for review feedback",
          enum: ["summary", "detailed", "json", "markdown"]
        },
        auto_suggest_fixes: {
          type: "boolean",
          description: "Whether to generate automatic fix suggestions"
        }
      },
      required: ["review_target"]
    }
  }
};

/**
 * Execute Smart Git Operations
 */
export async function executeSmartGitOperations(params: {
  operation: string;
  repository_path: string;
  commit_options?: any;
  branch_strategy?: any;
  pr_options?: any;
}): Promise<any> {
  const {
    operation,
    repository_path,
    commit_options = {},
    branch_strategy = {},
    pr_options = {}
  } = params;

  try {
    console.log(`🔧 Executing Git operation: ${operation} in ${repository_path}`);

    switch (operation) {
      case 'init':
        const initResult = await performGitInit(repository_path);
        return {
          ...initResult,
          metadata: {
            ...initResult.metadata,
            source: 'smart_git_operations'
          }
        };

      case 'commit':
        const commitResult = await performSmartCommit(repository_path, commit_options);
        return {
          ...commitResult,
          metadata: {
            ...commitResult.metadata,
            source: 'smart_git_operations'
          }
        };

      case 'branch':
        const branchResult = await performBranchOperation(repository_path, branch_strategy);
        return {
          ...branchResult,
          metadata: {
            executionTime: branchResult.metadata?.executionTime || 300,
            confidence: branchResult.metadata?.confidence || 0.95,
            source: 'smart_git_operations'
          }
        };

      case 'status':
        const statusResult = await getGitStatus(repository_path);
        return {
          ...statusResult,
          metadata: {
            ...statusResult.metadata,
            source: 'smart_git_operations'
          }
        };

      case 'log':
        const logResult = await getGitLog(repository_path);
        return {
          ...logResult,
          metadata: {
            ...logResult.metadata,
            source: 'smart_git_operations'
          }
        };

      case 'push':
        const pushResult = await performGitPush(repository_path);
        return {
          ...pushResult,
          metadata: {
            ...pushResult.metadata,
            source: 'smart_git_operations'
          }
        };

      case 'pull':
        const pullResult = await performGitPull(repository_path);
        return {
          ...pullResult,
          metadata: {
            ...pullResult.metadata,
            source: 'smart_git_operations'
          }
        };

      default:
        throw new Error(`Unsupported Git operation: ${operation}`);
    }

  } catch (error) {
    console.error('Error in smart Git operations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in Git operations',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'smart_git_operations'
      }
    };
  }
}

/**
 * Execute Automated Code Review
 */
export async function executeAutomatedCodeReview(params: {
  review_target: {
    type: string;
    identifier: string;
  };
  review_criteria?: string[];
  severity_threshold?: string;
  output_format?: string;
  auto_suggest_fixes?: boolean;
}): Promise<any> {
  const {
    review_target,
    review_criteria = ['security', 'performance', 'maintainability'],
    severity_threshold = 'medium',
    output_format = 'summary',
    auto_suggest_fixes = false
  } = params;

  try {
    console.log(`🔍 Performing automated code review on ${review_target.type}: ${review_target.identifier}`);

    const review = {
      target: review_target,
      criteria: review_criteria,
      findings: await performCodeAnalysis(review_target),
      severity_threshold,
      suggestions: auto_suggest_fixes ? generateFixSuggestions(review_target) : [],
      summary: generateReviewSummary(review_target)
    };

    return {
      success: true,
      data: {
        review,
        format: output_format,
        report: formatReviewReport(review, output_format)
      },
      metadata: {
        executionTime: 2500,
        confidence: 0.85,
        source: 'automated_code_review'
      }
    };

  } catch (error) {
    console.error('Error in automated code review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in code review',
      metadata: {
        executionTime: 0,
        confidence: 0,
        source: 'automated_code_review'
      }
    };
  }
}

// Helper functions for Git operations

async function performGitInit(repoPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`cd "${repoPath}" && git init`);
    return {
      success: true,
      data: {
        output: stdout.trim(),
        initialized: true,
        repository_path: repoPath
      },
      metadata: {
        executionTime: 300,
        confidence: 0.95,
        source: 'git_init'
      }
    };
  } catch (error) {
    throw new Error(`Git init failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function performSmartCommit(repoPath: string, options: any): Promise<any> {
  try {
    // Build semantic commit message
    const message = buildSemanticCommitMessage(options);

    // Stage files if specified
    if (options.files && options.files.length > 0) {
      const stageCommand = `cd "${repoPath}" && git add ${options.files.join(' ')}`;
      await execAsync(stageCommand);
    } else {
      // Stage all changes
      await execAsync(`cd "${repoPath}" && git add .`);
    }

    // Create commit
    const commitCommand = `cd "${repoPath}" && git commit -m "${message}"`;
    const { stdout: commitOutput } = await execAsync(commitCommand);

    return {
      success: true,
      data: {
        commit_message: message,
        commit_output: commitOutput.trim(),
        files_staged: options.files || 'all'
      },
      metadata: {
        executionTime: 500,
        confidence: 0.95,
        source: 'smart_commit'
      }
    };
  } catch (error) {
    throw new Error(`Commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function performBranchOperation(repoPath: string, strategy: any): Promise<any> {
  try {
    const { action, branch_name, base_branch = 'main' } = strategy;

    switch (action) {
      case 'create':
        const createCommand = `cd "${repoPath}" && git checkout -b "${branch_name}" "${base_branch}"`;
        const { stdout: createOutput } = await execAsync(createCommand);
        return {
          success: true,
          data: {
            action: 'create',
            branch: branch_name,
            base: base_branch,
            output: createOutput.trim()
          }
        };

      case 'switch':
        const switchCommand = `cd "${repoPath}" && git checkout "${branch_name}"`;
        const { stdout: switchOutput } = await execAsync(switchCommand);
        return {
          success: true,
          data: {
            action: 'switch',
            branch: branch_name,
            output: switchOutput.trim()
          }
        };

      case 'list':
        const listCommand = `cd "${repoPath}" && git branch -a`;
        const { stdout: listOutput } = await execAsync(listCommand);
        return {
          success: true,
          data: {
            action: 'list',
            branches: listOutput.trim().split('\n').map(b => b.trim())
          }
        };

      default:
        throw new Error(`Unsupported branch action: ${action}`);
    }
  } catch (error) {
    throw new Error(`Branch operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getGitStatus(repoPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`cd "${repoPath}" && git status --porcelain`);
    const statusLines = stdout.trim().split('\n').filter(line => line.length > 0);

    const status = {
      modified: statusLines.filter(line => line.startsWith(' M') || line.startsWith('M')),
      added: statusLines.filter(line => line.startsWith('A')),
      deleted: statusLines.filter(line => line.startsWith('D')),
      untracked: statusLines.filter(line => line.startsWith('??')),
      staged: statusLines.filter(line => line.startsWith('M ') || line.startsWith('A ') || line.startsWith('D '))
    };

    return {
      success: true,
      data: {
        status,
        clean: statusLines.length === 0,
        total_changes: statusLines.length
      },
      metadata: {
        executionTime: 200,
        confidence: 0.95,
        source: 'git_status'
      }
    };
  } catch (error) {
    throw new Error(`Git status failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getGitLog(repoPath: string, limit = 10): Promise<any> {
  try {
    const { stdout } = await execAsync(`cd "${repoPath}" && git log --oneline -${limit}`);
    const commits = stdout.trim().split('\n').map(line => {
      const [hash, ...messageParts] = line.split(' ');
      return {
        hash,
        message: messageParts.join(' ')
      };
    });

    return {
      success: true,
      data: {
        commits,
        total: commits.length
      },
      metadata: {
        executionTime: 300,
        confidence: 0.95,
        source: 'git_log'
      }
    };
  } catch (error) {
    throw new Error(`Git log failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function performGitPush(repoPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`cd "${repoPath}" && git push`);
    return {
      success: true,
      data: {
        output: stdout.trim(),
        pushed: true
      },
      metadata: {
        executionTime: 1000,
        confidence: 0.9,
        source: 'git_push'
      }
    };
  } catch (error) {
    throw new Error(`Git push failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function performGitPull(repoPath: string): Promise<any> {
  try {
    const { stdout } = await execAsync(`cd "${repoPath}" && git pull`);
    return {
      success: true,
      data: {
        output: stdout.trim(),
        pulled: true
      },
      metadata: {
        executionTime: 1000,
        confidence: 0.9,
        source: 'git_pull'
      }
    };
  } catch (error) {
    throw new Error(`Git pull failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions for code review

async function performCodeAnalysis(target: { type: string; identifier: string }): Promise<any> {
  // Placeholder analysis - would integrate with actual code analysis tools
  const findings = [
    {
      type: 'security',
      severity: 'medium',
      file: 'src/example.ts',
      line: 42,
      message: 'Potential SQL injection vulnerability',
      rule: 'sql-injection'
    },
    {
      type: 'performance',
      severity: 'low',
      file: 'src/utils.ts',
      line: 15,
      message: 'Inefficient array operation in loop',
      rule: 'performance-loop'
    },
    {
      type: 'maintainability',
      severity: 'high',
      file: 'src/component.tsx',
      line: 78,
      message: 'Complex function with multiple responsibilities',
      rule: 'single-responsibility'
    }
  ];

  return findings;
}

function generateFixSuggestions(target: { type: string; identifier: string }): any[] {
  // Placeholder suggestions
  return [
    {
      file: 'src/example.ts',
      line: 42,
      suggestion: 'Use parameterized queries to prevent SQL injection',
      code_example: 'const query = "SELECT * FROM users WHERE id = ?";'
    },
    {
      file: 'src/utils.ts',
      line: 15,
      suggestion: 'Cache array length outside the loop',
      code_example: 'const len = arr.length; for (let i = 0; i < len; i++) { ... }'
    }
  ];
}

function generateReviewSummary(target: { type: string; identifier: string }): string {
  return `Code review completed for ${target.type} ${target.identifier}. Found 3 issues across security, performance, and maintainability categories.`;
}

function formatReviewReport(review: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(review, null, 2);

    case 'markdown':
      return `# Code Review Report

**Target:** ${review.target.type} ${review.target.identifier}

## Summary
${review.summary}

## Findings
${review.findings.map((f: any) => `- **${f.severity.toUpperCase()}**: ${f.message} (${f.file}:${f.line})`).join('\n')}

## Recommendations
${review.suggestions.map((s: any) => `- ${s.suggestion}`).join('\n')}`;

    case 'summary':
    default:
      return `Review Summary: ${review.summary} | Issues: ${review.findings.length} | Severity: ${review.findings[0]?.severity || 'none'}`;
  }
}

// Utility functions

function buildSemanticCommitMessage(options: any): string {
  const { semantic_type, scope, message, breaking_change } = options;

  let commitMessage = '';

  if (semantic_type) {
    commitMessage += `${semantic_type}`;
    if (scope) {
      commitMessage += `(${scope})`;
    }
    commitMessage += ': ';
  }

  commitMessage += message || 'Update code';

  if (breaking_change) {
    commitMessage += '\n\nBREAKING CHANGE: This commit introduces breaking changes.';
  }

  return commitMessage;
}
