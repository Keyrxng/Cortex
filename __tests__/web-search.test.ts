/**
 * Tests for Web Search Tools
 *
 * Comprehensive test suite covering:
 * - Agentic web search functionality
 * - Web content extraction
 * - Web monitoring capabilities
 * - Error handling and edge cases
 */

// @ts-nocheck

// Mock external dependencies (must be declared before jest.mock calls)
const mockPuppeteer = {
  launch: jest.fn()
} as any;

const mockAxios = {
  get: jest.fn()
} as any;

const mockCheerio = {
  load: jest.fn()
} as any;

jest.mock('puppeteer', () => ({
  launch: mockPuppeteer.launch
}));
jest.mock('axios', () => ({
  get: mockAxios.get
}));
jest.mock('cheerio', () => ({
  load: mockCheerio.load
}));

import {
  executeAgenticWebSearch,
  executeExtractWebContent,
  executeMonitorWebChanges,
  agenticWebSearchTool,
  extractWebContentTool,
  monitorWebChangesTool
} from '../src/tools/web-search';
import { jest } from '@jest/globals';

describe('Web Search Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeAgenticWebSearch', () => {
    it('should perform basic web search successfully', async () => {
      const mockPage = {
        setUserAgent: jest.fn() as any,
        goto: jest.fn() as any,
        evaluate: jest.fn().mockResolvedValue([
          {
            title: 'Test Result',
            url: 'https://example.com',
            snippet: 'Test snippet',
            displayUrl: 'example.com'
          }
        ]) as any,
        close: jest.fn() as any
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage) as any,
        close: jest.fn() as any
      };

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeAgenticWebSearch({
        initial_query: 'test query'
      });

      expect(result.success).toBe(true);
      expect(result.data.query).toBe('test query');
      expect(result.data.results_found).toBe(1);
      expect(result.metadata.source).toBe('agentic_web_search');
    });

    it('should handle search with different depths', async () => {
      const mockPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue([]),
        close: jest.fn()
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn()
      } as any;

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeAgenticWebSearch({
        initial_query: 'test query',
        search_depth: 'deep'
      });

      expect(result.success).toBe(true);
      expect(result.data.search_depth).toBe('deep');
    });

    it('should follow citations when requested', async () => {
      const mockSearchPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue([
          {
            title: 'Test Result',
            url: 'https://example.com',
            snippet: 'Test snippet',
            displayUrl: 'example.com'
          }
        ]),
        close: jest.fn()
      };

      const mockCitationPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('Citation content'),
        close: jest.fn()
      };

      const mockBrowser = {
        newPage: jest.fn()
          .mockResolvedValueOnce(mockSearchPage)
          .mockResolvedValueOnce(mockCitationPage),
        close: jest.fn()
      } as any;

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeAgenticWebSearch({
        initial_query: 'test query',
        follow_citations: true
      });

      expect(result.success).toBe(true);
      expect(result.data.citation_results).toBeDefined();
    });

    it('should handle browser launch errors', async () => {
      mockPuppeteer.launch.mockRejectedValue(new Error('Browser launch failed'));

      const result = await executeAgenticWebSearch({
        initial_query: 'test query'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Browser launch failed');
    });

    it('should synthesize results in different modes', async () => {
      const mockPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue([]),
        close: jest.fn()
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn()
      } as any;

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeAgenticWebSearch({
        initial_query: 'test query',
        synthesis_mode: 'detailed'
      });

      expect(result.success).toBe(true);
      expect(result.data.synthesis.mode).toBe('detailed');
    });
  });

  describe('executeExtractWebContent', () => {
    beforeEach(() => {
      mockAxios.get.mockReset();
      mockCheerio.load.mockReset();
    });

    it('should extract content using axios and cheerio', async () => {
      mockAxios.get.mockResolvedValue({
        data: '<html><body><main>Test content</main></body></html>'
      });

      const mock$ = jest.fn().mockImplementation((selector) => {
        if (selector === 'body') {
          return {
            text: jest.fn().mockReturnValue('Test content')
          };
        }
        return {
          text: jest.fn().mockReturnValue(''),
          find: jest.fn().mockReturnValue([]),
          attr: jest.fn(),
          html: jest.fn()
        };
      });

      mockCheerio.load.mockReturnValue(mock$);

      const result = await executeExtractWebContent({
        urls: ['https://example.com'],
        extraction_mode: 'full_text',
        javascript_rendering: false
      });

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].extracted_content).toBe('Test content');
    });

    it('should handle multiple URLs', async () => {
      mockAxios.get
        .mockResolvedValueOnce({
          data: '<html><body><main>Content 1</main></body></html>'
        })
        .mockResolvedValueOnce({
          data: '<html><body><main>Content 2</main></body></html>'
        });

      const mock$ = jest.fn().mockImplementation((selector) => {
        if (selector === 'body') {
          return {
            text: jest.fn().mockReturnValue('Content')
          };
        }
        return {
          text: jest.fn().mockReturnValue(''),
          find: jest.fn().mockReturnValue([]),
          attr: jest.fn(),
          html: jest.fn()
        };
      });

      mockCheerio.load.mockReturnValue(mock$);

      const result = await executeExtractWebContent({
        urls: ['https://example1.com', 'https://example2.com']
      });

      expect(result.success).toBe(true);
      expect(result.data.results).toHaveLength(2);
    });

    it('should extract structured content', async () => {
      mockAxios.get.mockResolvedValue({
        data: '<html><head><title>Test Title</title></head><body><h1>Heading</h1></body></html>'
      });

      const mock$ = jest.fn().mockImplementation((selector) => {
        if (selector === 'title') {
          return {
            text: jest.fn().mockReturnValue('Test Title')
          };
        }
        if (selector === 'meta[name="description"]') {
          return {
            attr: jest.fn().mockReturnValue('')
          };
        }
        if (selector === 'h1, h2, h3') {
          return {
            map: jest.fn().mockReturnValue({
              get: jest.fn().mockReturnValue([
                { level: 'h1', text: 'Heading' }
              ])
            })
          };
        }
        if (selector === 'a[href]') {
          return {
            map: jest.fn().mockReturnValue({
              get: jest.fn().mockReturnValue([
                { text: 'Link', href: 'https://example.com' }
              ])
            })
          };
        }
        return {
          text: jest.fn().mockReturnValue(''),
          find: jest.fn().mockReturnValue([]),
          attr: jest.fn(),
          html: jest.fn()
        };
      });

      mockCheerio.load.mockReturnValue(mock$);

      const result = await executeExtractWebContent({
        urls: ['https://example.com'],
        extraction_mode: 'structured'
      });

      expect(result.success).toBe(true);
      expect(result.data.results[0].metadata.title).toBe('Test Title');
    });

    it('should handle extraction errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await executeExtractWebContent({
        urls: ['https://example.com']
      });

      expect(result.success).toBe(true); // Should still succeed with error handling
      expect(result.data.results[0].extracted_content).toContain('Failed to extract');
    });

    it('should use puppeteer for JavaScript rendering', async () => {
      const mockPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('JS rendered content'),
        title: jest.fn().mockResolvedValue('Page Title'),
        close: jest.fn()
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn()
      } as any;

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeExtractWebContent({
        urls: ['https://example.com'],
        javascript_rendering: true
      });

      expect(result.success).toBe(true);
      expect(result.data.results[0].extracted_content).toBe('JS rendered content');
    });
  });

  describe('executeMonitorWebChanges', () => {
    it('should set up monitoring for web targets', async () => {
      const mockPage = {
        setUserAgent: jest.fn(),
        goto: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('baseline content'),
        close: jest.fn()
      };

      const mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn()
      } as any;

      mockPuppeteer.launch.mockResolvedValue(mockBrowser);

      const result = await executeMonitorWebChanges({
        targets: [{
          url: 'https://example.com',
          type: 'webpage',
          check_interval: 60
        }]
      });

      expect(result.success).toBe(true);
      expect(result.data.targets).toHaveLength(1);
      expect(result.data.targets[0].status).toBe('active');
    });

    it('should handle monitoring setup errors', async () => {
      mockPuppeteer.launch.mockRejectedValue(new Error('Browser error'));

      const result = await executeMonitorWebChanges({
        targets: [{
          url: 'https://example.com',
          type: 'webpage'
        }]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Browser error');
    });
  });

  describe('Tool Schemas', () => {
    it('should have valid agentic web search tool schema', () => {
      expect(agenticWebSearchTool.type).toBe('function');
      expect(agenticWebSearchTool.function.name).toBe('agentic_web_search');
      expect(agenticWebSearchTool.function.parameters.required).toContain('initial_query');
    });

    it('should have valid extract web content tool schema', () => {
      expect(extractWebContentTool.type).toBe('function');
      expect(extractWebContentTool.function.name).toBe('extract_web_content');
      expect(extractWebContentTool.function.parameters.required).toContain('urls');
    });

    it('should have valid monitor web changes tool schema', () => {
      expect(monitorWebChangesTool.type).toBe('function');
      expect(monitorWebChangesTool.function.name).toBe('monitor_web_changes');
      expect(monitorWebChangesTool.function.parameters.required).toContain('targets');
    });
  });
});
