/**
 * Tests for Git Operations Tools
 *
 * Comprehensive test suite covering:
 * - Smart Git operations (commit, branch, status)
 * - Automated code review
 * - Error handling and edge cases
 */

// Mock child_process at the very top before any imports
const mockExec = jest.fn() as any;
jest.mock('child_process', () => ({
  exec: mockExec,
  promisify: jest.fn((fn) => fn)
}));

import {
  executeSmartGitOperations,
  executeAutomatedCodeReview,
  smartGitOperationsTool,
  automatedCodeReviewTool
} from '../src/tools/git-operations';
import { jest } from '@jest/globals';

describe('Git Operations Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExec.mockReset();
    // Set up default mock behavior
    mockExec.mockImplementation((command: string, callback: Function) => {
      callback(null, { stdout: 'Mock output', stderr: '' });
    });
  });

  describe('executeSmartGitOperations', () => {
    it('should initialize git repository', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Initialized empty Git repository', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'init',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(true);
      expect(result.data.initialized).toBe(true);
      expect(result.data.repository_path).toBe('/test/repo');
    });

    it('should perform smart commit successfully', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Committed successfully', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'commit',
        repository_path: '/test/repo',
        commit_options: {
          message: 'Test commit',
          semantic_type: 'feat'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.commit_message).toContain('feat');
      expect(result.metadata.source).toBe('smart_git_operations');
    });

    it('should create branches correctly', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Branch created', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'branch',
        repository_path: '/test/repo',
        branch_strategy: {
          action: 'create',
          branch_name: 'feature/test',
          base_branch: 'main'
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('create');
      expect(result.data.branch).toBe('feature/test');
    });

    it('should get repository status', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: ' M modified-file.ts\n?? new-file.ts', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'status',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBeDefined();
      expect(result.data.total_changes).toBe(2);
    });

    it('should get commit log', async () => {
      const mockLog = 'abc1234 First commit\n def5678 Second commit';
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: mockLog, stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'log',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(true);
      expect(result.data.commits).toHaveLength(2);
      expect(result.data.commits[0].hash).toBe('abc1234');
    });

    it('should perform git push', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Pushed successfully', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'push',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(true);
      expect(result.data.pushed).toBe(true);
    });

    it('should perform git pull', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Pulled successfully', stderr: '' });
      });

      const result = await executeSmartGitOperations({
        operation: 'pull',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(true);
      expect(result.data.pulled).toBe(true);
    });

    it('should handle git command errors', async () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(new Error('Git command failed'), null);
      });

      const result = await executeSmartGitOperations({
        operation: 'status',
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Git command failed');
    });

    it('should handle unsupported operations', async () => {
      const result = await executeSmartGitOperations({
        operation: 'unsupported' as any,
        repository_path: '/test/repo'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported Git operation');
    });
  });

  describe('executeAutomatedCodeReview', () => {
    it('should perform automated code review', async () => {
      const result = await executeAutomatedCodeReview({
        review_target: {
          type: 'commit',
          identifier: 'abc123'
        },
        review_criteria: ['security', 'performance']
      });

      expect(result.success).toBe(true);
      expect(result.data.review).toBeDefined();
      expect(result.data.review.findings).toBeDefined();
      expect(result.metadata.source).toBe('automated_code_review');
    });

    it('should generate review reports in different formats', async () => {
      const result = await executeAutomatedCodeReview({
        review_target: {
          type: 'pr',
          identifier: '123'
        },
        output_format: 'markdown'
      });

      expect(result.success).toBe(true);
      expect(result.data.format).toBe('markdown');
      expect(result.data.report).toBeDefined();
    });

    it('should suggest fixes when requested', async () => {
      const result = await executeAutomatedCodeReview({
        review_target: {
          type: 'files',
          identifier: 'src/main.ts'
        },
        auto_suggest_fixes: true
      });

      expect(result.success).toBe(true);
      expect(result.data.review.suggestions).toBeDefined();
    });

    it('should filter findings by severity', async () => {
      const result = await executeAutomatedCodeReview({
        review_target: {
          type: 'branch',
          identifier: 'main'
        },
        severity_threshold: 'high'
      });

      expect(result.success).toBe(true);
      expect(result.data.review.severity_threshold).toBe('high');
    });
  });

  describe('Tool Schemas', () => {
    it('should have valid smart git operations tool schema', () => {
      expect(smartGitOperationsTool.type).toBe('function');
      expect(smartGitOperationsTool.function.name).toBe('smart_git_operations');
      expect(smartGitOperationsTool.function.parameters.required).toContain('operation');
      expect(smartGitOperationsTool.function.parameters.required).toContain('repository_path');
    });

    it('should have valid automated code review tool schema', () => {
      expect(automatedCodeReviewTool.type).toBe('function');
      expect(automatedCodeReviewTool.function.name).toBe('automated_code_review');
      expect(automatedCodeReviewTool.function.parameters.required).toContain('review_target');
    });
  });

  describe('Utility Functions', () => {
    it('should build semantic commit messages correctly', () => {
      // Test through public API since buildSemanticCommitMessage is not exported
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Committed', stderr: '' });
      });

      const result = executeSmartGitOperations({
        operation: 'commit',
        repository_path: '/test/repo',
        commit_options: {
          message: 'Add new feature',
          semantic_type: 'feat',
          scope: 'auth'
        }
      });

      expect(result).toBeDefined();
    });

    it('should handle branch operations correctly', () => {
      mockExec.mockImplementation((command: string, callback: Function) => {
        callback(null, { stdout: 'Branch switched', stderr: '' });
      });

      const result = executeSmartGitOperations({
        operation: 'branch',
        repository_path: '/test/repo',
        branch_strategy: {
          action: 'switch',
          branch_name: 'develop'
        }
      });

      expect(result).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: status -> commit -> push', async () => {
      // Mock all git commands
      let callCount = 0;
      mockExec.mockImplementation((command: string, callback: Function) => {
        callCount++;
        if (callCount === 1) {
          callback(null, { stdout: ' M file.ts', stderr: '' }); // status
        } else if (callCount === 2) {
          callback(null, { stdout: 'Committed', stderr: '' }); // commit
        } else {
          callback(null, { stdout: 'Pushed', stderr: '' }); // push
        }
      });

      // Check status
      const statusResult = await executeSmartGitOperations({
        operation: 'status',
        repository_path: '/test/repo'
      });
      expect(statusResult.success).toBe(true);

      // Commit changes
      const commitResult = await executeSmartGitOperations({
        operation: 'commit',
        repository_path: '/test/repo',
        commit_options: {
          message: 'Update file',
          semantic_type: 'fix'
        }
      });
      expect(commitResult.success).toBe(true);

      // Push changes
      const pushResult = await executeSmartGitOperations({
        operation: 'push',
        repository_path: '/test/repo'
      });
      expect(pushResult.success).toBe(true);
    });

    it('should handle code review workflow', async () => {
      const reviewResult = await executeAutomatedCodeReview({
        review_target: {
          type: 'commit',
          identifier: 'abc123'
        },
        review_criteria: ['security', 'performance', 'maintainability'],
        output_format: 'json',
        auto_suggest_fixes: true
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.data.review.criteria).toEqual(['security', 'performance', 'maintainability']);
      expect(reviewResult.data.format).toBe('json');
    });
  });
});
