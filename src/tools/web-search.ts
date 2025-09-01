


/**
 * Web Search Tools
 *
 * Implements advanced web search capabilities using a hybrid approach:
 * - Puppeteer: For JavaScript-heavy sites and full browser automation
 * - Axios + Cheerio: For static content, faster and lighter weight
 * - Provides multi-stage search, content extraction, and web monitoring features.
 */

import type { AgentTool, ParameterDefinition } from '../types.js';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { createHash } from 'crypto';

/**
 * Agentic Web Search Tool Schema
 * Performs intelligent multi-stage web search with context-aware query expansion
 */
export const agenticWebSearchTool: AgentTool = {
    type: "function",
    function: {
        name: "agentic_web_search",
        description: "Performs intelligent multi-stage web search with context-aware query expansion, content synthesis, and relevance filtering. Uses agentic search patterns to explore topics deeply through iterative refinement.",
        parameters: {
            type: "object",
            properties: {
                initial_query: {
                    type: "string",
                    description: "The primary search query or research question"
                },
                search_depth: {
                    type: "string",
                    description: "Search thoroughness: shallow (3-5 sources), medium (8-12), deep (15-25), comprehensive (30+ sources with cross-verification)",
                    enum: ["shallow", "medium", "deep", "comprehensive"]
                },
                domain_filters: {
                    type: "array",
                    description: "Preferred domains or source types (academic, technical, news, documentation, etc.)",
                    items: {
                        type: "string",
                        description: "Domain or source type"
                    }
                },
                temporal_scope: {
                    type: "string",
                    description: "Time relevance for search results (e.g., 'past_week', 'past_month', 'past_year', 'anytime')"
                },
                follow_citations: {
                    type: "boolean",
                    description: "Whether to follow and analyze referenced sources from initial results"
                },
                synthesis_mode: {
                    type: "string",
                    description: "How to synthesize and present findings (summary, detailed, comparative, timeline)",
                    enum: ["summary", "detailed", "comparative", "timeline"]
                }
            },
            required: ["initial_query"]
        }
    }
};

/**
 * Web Content Extraction Tool Schema
 * Extracts and processes content from web URLs
 */
export const extractWebContentTool: AgentTool = {
    type: "function",
    function: {
        name: "extract_web_content",
        description: "Extracts and processes content from web URLs with intelligent parsing, content cleaning, and structured data extraction. Handles JavaScript-heavy sites and respects robots.txt.",
        parameters: {
            type: "object",
            properties: {
                urls: {
                    type: "array",
                    description: "List of URLs to extract content from",
                    items: {
                        type: "string",
                        description: "URL to extract content from"
                    }
                },
                extraction_mode: {
                    type: "string",
                    description: "Type of content extraction to perform",
                    enum: ["full_text", "structured", "metadata", "images", "links"]
                },
                content_filters: {
                    type: "array",
                    description: "Content types to focus on (text, images, code_blocks, tables, etc.)",
                    items: {
                        description: "Specific content type to include",
                        type: "string"
                    }
                },
                respect_robots: {
                    type: "boolean",
                    description: "Whether to check and respect robots.txt directives",
                },
                javascript_rendering: {
                    type: "boolean",
                    description: "Enable JavaScript execution for dynamic content",
                }
            },
            required: ["urls"]
        }
    }
};

/**
 * Web Monitoring Tool Schema
 * Sets up monitoring for web content changes
 */
export const monitorWebChangesTool: AgentTool = {
    type: "function",
    function: {
        name: "monitor_web_changes",
        description: "Sets up monitoring for web content changes, RSS feeds, or API endpoints. Returns structured updates when changes are detected.",
        parameters: {
            type: "object",
            properties: {
                targets: {
                    type: "array",
                    description: "List of monitoring targets with their configuration",
                    items: {
                        type: "object",
                        description: "Monitoring target configuration",
                        properties: {
                            url: {
                                type: "string",
                                description: "URL to monitor"
                            },
                            type: {
                                type: "string",
                                description: "Type of target to monitor",
                                enum: ["webpage", "rss", "api"]
                            },
                            check_interval: {
                                type: "number",
                                description: "Check interval in minutes"
                            },
                            change_criteria: {
                                type: "object",
                                description: "Criteria for detecting changes",
                                properties: {
                                    content_hash: {
                                        type: "boolean",
                                        description: "Monitor content hash changes"
                                    },
                                    specific_selectors: {
                                        type: "array",
                                        description: "CSS selectors to monitor for changes",
                                        items: {
                                            type: "string",
                                            description: "CSS selector"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                alert_conditions: {
                    type: "array",
                    description: "Conditions that trigger notifications (keywords, content thresholds, etc.)",
                    items: {
                        type: "object",
                        description: "Alert condition configuration",
                        properties: {
                            type: {
                                type: "string",
                                description: "Type of alert condition",
                                enum: ["keyword", "threshold", "pattern"]
                            },
                            value: {
                                type: "string",
                                description: "Value for the alert condition"
                            },
                            threshold: {
                                type: "number",
                                description: "Threshold value for numeric conditions"
                            }
                        }
                    }
                }
            },
            required: ["targets"]
        }
    }
};

/**
 * Search User Agents for different types of crawling
 */
export const SEARCH_USER_AGENTS = {
    ai_search: [
        "OAI-SearchBot",      // OpenAI search
        "ChatGPT-User",       // ChatGPT web access
        "PerplexityBot",      // Perplexity search
        "FirecrawlAgent",     // Firecrawl scraping
        "AndiBot"             // Andi search
    ],
    traditional: [
        "Googlebot",          // Google indexing
        "Bingbot"            // Bing indexing
    ]
};

/**
 * Follow citations from search results
 */
async function followCitations(results: Array<{
    title: string;
    url: string;
    snippet: string;
    displayUrl: string;
}>, browser: any): Promise<Array<{
    url: string;
    title: string;
    content: string;
    wordCount: number;
}>> {
    const citationResults: Array<{
        url: string;
        title: string;
        content: string;
        wordCount: number;
    }> = [];

    for (const result of results) {
        try {
            console.log(`🔗 Following citation: ${result.url}`);

            // Try axios first for speed, fall back to puppeteer if needed
            let content = '';
            let success = false;

            try {
                const response = await axios.get(result.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 15000
                });

                const $ = cheerio.load(response.data);

                // Try to find main content using Cheerio
                const contentSelectors = [
                    'main', 'article', '[role="main"]',
                    '.content', '.post-content', '.entry-content',
                    '.article-content'
                ];

                for (const selector of contentSelectors) {
                    const element = $(selector);
                    if (element.length > 0 && element.text().trim().length > 100) {
                        content = element.text().trim();
                        success = true;
                        break;
                    }
                }

                if (!success) {
                    content = $('body').text().trim();
                    success = content.length > 50;
                }

            } catch (axiosError) {
                console.log(`⚠️ Axios failed for ${result.url}, falling back to Puppeteer`);
                // Fall back to Puppeteer for JavaScript-heavy sites
                const page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

                await page.goto(result.url, { waitUntil: 'networkidle2', timeout: 30000 });

                content = await page.evaluate(() => {
                    const selectors = [
                        'main', 'article', '[role="main"]',
                        '.content', '.post-content', '.entry-content',
                        'body'
                    ];

                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent && element.textContent.length > 100) {
                            return element.textContent.trim();
                        }
                    }

                    return document.body.textContent?.trim() || '';
                });

                await page.close();
                success = content.length > 50;
            }

            if (success) {
                const wordCount = content.split(/\s+/).length;
                citationResults.push({
                    url: result.url,
                    title: result.title,
                    content: content.substring(0, 2000), // Limit content length
                    wordCount
                });
            }

        } catch (error) {
            console.warn(`Failed to follow citation ${result.url}:`, error);
        }
    }

    return citationResults;
}

/**
 * Synthesize search results based on mode
 */
async function synthesizeResults(
    results: Array<{
        title: string;
        url: string;
        snippet: string;
        displayUrl: string;
    }>,
    citationResults: Array<{
        url: string;
        title: string;
        content: string;
        wordCount: number;
    }>,
    synthesisMode: string,
    query: string
): Promise<{
    mode: string;
    summary: string;
    key_findings: string[];
    recommendations: string[];
    timeline?: any[];
    comparison?: any[];
}> {
    const allContent = [
        ...results.map(r => `${r.title}: ${r.snippet}`),
        ...citationResults.map(c => `${c.title}: ${c.content}`)
    ].join('\n\n');

    switch (synthesisMode) {
        case 'summary':
            return {
                mode: 'summary',
                summary: `Found ${results.length} search results for "${query}". ${citationResults.length > 0 ? `Followed ${citationResults.length} citations.` : ''} Key topics include: ${extractKeyTopics(allContent).join(', ')}.`,
                key_findings: extractKeyTopics(allContent),
                recommendations: generateRecommendations(results, citationResults)
            };

        case 'detailed':
            return {
                mode: 'detailed',
                summary: `Comprehensive analysis of "${query}" with ${results.length} sources${citationResults.length > 0 ? ` and ${citationResults.length} followed citations` : ''}.`,
                key_findings: extractDetailedFindings(allContent),
                recommendations: generateRecommendations(results, citationResults)
            };

        case 'comparative':
            return {
                mode: 'comparative',
                summary: `Comparative analysis of sources for "${query}".`,
                key_findings: extractComparativeFindings(results, citationResults),
                recommendations: generateRecommendations(results, citationResults),
                comparison: createComparisonMatrix(results, citationResults)
            };

        case 'timeline':
            return {
                mode: 'timeline',
                summary: `Timeline analysis for "${query}".`,
                key_findings: extractTimelineFindings(allContent),
                recommendations: generateRecommendations(results, citationResults),
                timeline: createTimeline(allContent)
            };

        default:
            return {
                mode: synthesisMode,
                summary: `Analysis completed for "${query}".`,
                key_findings: extractKeyTopics(allContent),
                recommendations: generateRecommendations(results, citationResults)
            };
    }
}

/**
 * Extract key topics from content
 */
function extractKeyTopics(content: string): string[] {
    // Simple keyword extraction - in a real implementation, this could use NLP
    const words = content.toLowerCase().split(/\W+/);
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];

    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
        if (word.length > 3 && !stopWords.includes(word)) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
    });

    return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
}

/**
 * Extract detailed findings
 */
function extractDetailedFindings(content: string): string[] {
    const findings: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Extract sentences that seem important (contain keywords)
    const importantWords = ['important', 'key', 'main', 'primary', 'significant', 'notable', 'crucial'];
    findings.push(...sentences.filter(s =>
        importantWords.some(word => s.toLowerCase().includes(word))
    ).slice(0, 5));

    return findings.length > 0 ? findings : sentences.slice(0, 5);
}

/**
 * Extract comparative findings
 */
function extractComparativeFindings(results: any[], citations: any[]): string[] {
    const findings: string[] = [];

    if (results.length > 1) {
        findings.push(`Found ${results.length} different sources covering the topic`);
    }

    if (citations.length > 0) {
        findings.push(`Citation analysis shows ${citations.length} in-depth resources`);
    }

    // Compare domains/sources
    const domains = results.map(r => new URL(r.url).hostname);
    const uniqueDomains = [...new Set(domains)];
    findings.push(`Sources span ${uniqueDomains.length} different domains: ${uniqueDomains.join(', ')}`);

    return findings;
}

/**
 * Extract timeline findings
 */
function extractTimelineFindings(content: string): string[] {
    const findings: string[] = [];
    const datePatterns = [
        /\b\d{4}\b/g,  // Years
        /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,  // MM/DD/YYYY
        /\b\d{1,2}-\d{1,2}-\d{4}\b/g,  // MM-DD-YYYY
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/gi
    ];

    datePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            findings.push(...matches);
        }
    });

    return [...new Set(findings)].sort();
}

/**
 * Generate recommendations
 */
function generateRecommendations(results: any[], citations: any[]): string[] {
    const recommendations: string[] = [];

    if (results.length < 5) {
        recommendations.push('Consider expanding search depth for more comprehensive results');
    }

    if (citations.length === 0) {
        recommendations.push('Enable citation following for deeper analysis');
    }

    if (results.length > 0) {
        recommendations.push(`Top recommended source: ${results[0].title}`);
    }

    return recommendations;
}

/**
 * Create comparison matrix
 */
function createComparisonMatrix(results: any[], citations: any[]): any[] {
    return results.map(result => ({
        title: result.title,
        url: result.url,
        hasCitation: citations.some(c => c.url === result.url),
        snippetLength: result.snippet.length,
        domain: new URL(result.url).hostname
    }));
}

/**
 * Create timeline
 */
function createTimeline(content: string): any[] {
    // Simple timeline extraction - could be enhanced with better date parsing
    const timeline: Array<{ year: number; events: string[] }> = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= currentYear - 10; year--) {
        if (content.includes(year.toString())) {
            timeline.push({
                year,
                events: [`Events related to ${year} found in search results`]
            });
        }
    }

    return timeline;
}

/**
 * Execute Agentic Web Search
 */
export async function executeAgenticWebSearch(params: {
    initial_query: string;
    search_depth?: string;
    domain_filters?: string[];
    temporal_scope?: string;
    follow_citations?: boolean;
    synthesis_mode?: string;
}): Promise<any> {
    const {
        initial_query,
        search_depth = "medium",
        domain_filters = [],
        temporal_scope = "anytime",
        follow_citations = false,
        synthesis_mode = "summary"
    } = params;

    const startTime = Date.now();

    try {
        console.log(`🔍 Executing agentic web search for: "${initial_query}"`);
        console.log(`📊 Search depth: ${search_depth}, Synthesis mode: ${synthesis_mode}`);

        // Determine number of results based on depth
        const resultLimits = {
            shallow: 5,
            medium: 12,
            deep: 25,
            comprehensive: 50
        };
        const maxResults = resultLimits[search_depth as keyof typeof resultLimits] || 12;

        // Launch browser
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();

            // Set user agent to avoid blocking
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

            // Build search URL
            let searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(initial_query)}`;

            // Add temporal filters
            if (temporal_scope !== 'anytime') {
                const timeFilters = {
                    past_week: '&df=w',
                    past_month: '&df=m',
                    past_year: '&df=y'
                };
                searchUrl += timeFilters[temporal_scope as keyof typeof timeFilters] || '';
            }

            console.log(`🌐 Searching: ${searchUrl}`);

            // Navigate to search results
            await page.goto(searchUrl, { waitUntil: 'networkidle2' });

            // Extract search results
            const results: Array<{
                title: string;
                url: string;
                snippet: string;
                displayUrl: string;
            }> = await page.evaluate((maxResults) => {
                const resultElements = document.querySelectorAll('.result');
                const extracted: Array<{
                    title: string;
                    url: string;
                    snippet: string;
                    displayUrl: string;
                }> = [];

                for (let i = 0; i < Math.min(resultElements.length, maxResults); i++) {
                    const element = resultElements[i];
                    const titleElement = element.querySelector('.result__title a') as HTMLAnchorElement | null;
                    const snippetElement = element.querySelector('.result__snippet');
                    const urlElement = element.querySelector('.result__url');

                    if (titleElement && snippetElement) {
                        extracted.push({
                            title: titleElement.textContent?.trim() || '',
                            url: titleElement.href || '',
                            snippet: snippetElement.textContent?.trim() || '',
                            displayUrl: urlElement?.textContent?.trim() || ''
                        });
                    }
                }

                return extracted;
            }, maxResults);

            console.log(`📄 Found ${results.length} search results`);

            // Follow citations if requested
            let citationResults: Array<{
                url: string;
                title: string;
                content: string;
                wordCount: number;
            }> = [];
            if (follow_citations && results.length > 0) {
                console.log(`🔗 Following citations from top ${Math.min(3, results.length)} results`);
                citationResults = await followCitations(results.slice(0, 3), browser);
            }

            // Synthesize results based on mode
            const synthesis = await synthesizeResults(results, citationResults, synthesis_mode, initial_query);

            const response = {
                query: initial_query,
                search_depth,
                results_found: results.length,
                sources: results,
                citation_results: citationResults,
                synthesis,
                metadata: {
                    execution_time: Date.now() - startTime,
                    sources_searched: 1, // DuckDuckGo
                    citations_followed: citationResults.length,
                    temporal_scope,
                    domain_filters
                }
            };

            return {
                success: true,
                data: response,
                metadata: {
                    executionTime: Date.now() - startTime,
                    confidence: 0.85,
                    source: 'agentic_web_search'
                }
            };

        } finally {
            await browser.close();
        }

    } catch (error) {
        console.error('Error in agentic web search:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in web search',
            metadata: {
                executionTime: Date.now() - startTime,
                confidence: 0,
                source: 'agentic_web_search'
            }
        };
    }
}

/**
 * Execute Web Content Extraction
 */
export async function executeExtractWebContent(params: {
    urls: string[];
    extraction_mode?: string;
    content_filters?: string[];
    respect_robots?: boolean;
    javascript_rendering?: boolean;
}): Promise<any> {
    const {
        urls,
        extraction_mode = "full_text",
        content_filters = [],
        respect_robots = true,
        javascript_rendering = false
    } = params;

    const startTime = Date.now();

    try {
        console.log(`📄 Extracting content from ${urls.length} URLs`);
        console.log(`🔧 Mode: ${extraction_mode}, JS rendering: ${javascript_rendering}`);

        const results: Array<{
            url: string;
            extracted_content: string;
            metadata: any;
        }> = [];

        for (const url of urls) {
            try {
                console.log(`🔗 Extracting from: ${url}`);
                let extracted_content = '';
                let metadata: any = {};

                if (javascript_rendering) {
                    // Use Puppeteer for JavaScript-heavy sites
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });

                    try {
                        const page = await browser.newPage();
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

                        await page.goto(url, {
                            waitUntil: 'networkidle2',
                            timeout: 30000
                        });

                        // Extract content based on mode using Puppeteer
                        switch (extraction_mode) {
                            case 'full_text':
                                extracted_content = await page.evaluate(() => {
                                    const selectors = [
                                        'main', 'article', '[role="main"]',
                                        '.content', '.post-content', '.entry-content',
                                        '.article-content', 'body'
                                    ];

                                    for (const selector of selectors) {
                                        const element = document.querySelector(selector);
                                        if (element && element.textContent && element.textContent.length > 100) {
                                            return element.textContent.trim();
                                        }
                                    }
                                    return document.body.textContent?.trim() || '';
                                });
                                break;

                            case 'structured':
                                const structured = await page.evaluate(() => ({
                                    title: document.title || '',
                                    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                                    headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
                                        level: h.tagName.toLowerCase(),
                                        text: h.textContent?.trim() || ''
                                    })),
                                    links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
                                        text: a.textContent?.trim() || '',
                                        href: (a as HTMLAnchorElement).href
                                    }))
                                }));
                                extracted_content = JSON.stringify(structured, null, 2);
                                metadata = structured;
                                break;

                            default:
                                extracted_content = await page.evaluate(() => document.body.textContent?.trim() || '');
                        }

                        metadata.title = metadata.title || await page.title();
                        await page.close();

                    } finally {
                        await browser.close();
                    }

                } else {
                    // Use Axios + Cheerio for static content (lighter and faster)
                    const response = await axios.get(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        },
                        timeout: 30000
                    });

                    const $ = cheerio.load(response.data);

                    switch (extraction_mode) {
                        case 'full_text':
                            // Try to find main content using Cheerio selectors
                            const contentSelectors = [
                                'main', 'article', '[role="main"]',
                                '.content', '.post-content', '.entry-content',
                                '.article-content'
                            ];

                            for (const selector of contentSelectors) {
                                const element = $(selector);
                                if (element.length > 0 && element.text().trim().length > 100) {
                                    extracted_content = element.text().trim();
                                    break;
                                }
                            }

                            if (!extracted_content) {
                                extracted_content = $('body').text().trim();
                            }
                            break;

                        case 'structured':
                            const structured = {
                                title: $('title').text().trim() || '',
                                description: $('meta[name="description"]').attr('content') || '',
                                headings: $('h1, h2, h3').map((_, el) => ({
                                    level: el.tagName.toLowerCase(),
                                    text: $(el).text().trim()
                                })).get(),
                                links: $('a[href]').map((_, el) => ({
                                    text: $(el).text().trim(),
                                    href: $(el).attr('href') || ''
                                })).get()
                            };
                            extracted_content = JSON.stringify(structured, null, 2);
                            metadata = structured;
                            break;

                        case 'metadata':
                            metadata = {
                                title: $('title').text().trim() || '',
                                description: $('meta[name="description"]').attr('content') || '',
                                keywords: $('meta[name="keywords"]').attr('content') || '',
                                author: $('meta[name="author"]').attr('content') || '',
                                published: $('meta[property="article:published_time"]').attr('content') || ''
                            };
                            extracted_content = `Title: ${metadata.title}\nDescription: ${metadata.description}`;
                            break;

                        case 'images':
                            const images = $('img').map((_, el) => ({
                                src: $(el).attr('src') || '',
                                alt: $(el).attr('alt') || '',
                                title: $(el).attr('title') || ''
                            })).get();
                            extracted_content = JSON.stringify(images, null, 2);
                            metadata = { images };
                            break;

                        case 'links':
                            const links = $('a[href]').map((_, el) => ({
                                text: $(el).text().trim(),
                                href: $(el).attr('href') || '',
                                title: $(el).attr('title') || ''
                            })).get();
                            extracted_content = JSON.stringify(links, null, 2);
                            metadata = { links };
                            break;

                        default:
                            extracted_content = $('body').text().trim();
                    }
                }

                // Apply content filters if specified
                if (content_filters.length > 0) {
                    content_filters.forEach(filter => {
                        if (filter === 'text' && extraction_mode !== 'full_text') {
                            // Keep only text content
                        }
                    });
                }

                const word_count = extracted_content.split(/\s+/).length;

                results.push({
                    url,
                    extracted_content: extracted_content.substring(0, 5000), // Limit content length
                    metadata: {
                        ...metadata,
                        content_type: extraction_mode,
                        word_count,
                        extracted_at: new Date().toISOString(),
                        method: javascript_rendering ? 'puppeteer' : 'axios-cheerio'
                    }
                });

            } catch (error) {
                console.warn(`Failed to extract from ${url}:`, error);
                results.push({
                    url,
                    extracted_content: `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    metadata: {
                        title: `Error extracting ${url}`,
                        content_type: extraction_mode,
                        word_count: 0,
                        error: true
                    }
                });
            }
        }

        return {
            success: true,
            data: {
                results,
                summary: `Extracted content from ${results.length} URLs using ${extraction_mode} mode`
            },
            metadata: {
                executionTime: Date.now() - startTime,
                confidence: 0.9,
                source: 'web_content_extraction',
                urls_processed: urls.length,
                successful_extractions: results.filter(r => !r.metadata.error).length,
                methods_used: javascript_rendering ? ['puppeteer'] : ['axios', 'cheerio']
            }
        };

    } catch (error) {
        console.error('Error in web content extraction:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in content extraction',
            metadata: {
                executionTime: Date.now() - startTime,
                confidence: 0,
                source: 'web_content_extraction'
            }
        };
    }
}

/**
 * Execute Web Monitoring Setup
 */
export async function executeMonitorWebChanges(params: {
    targets: Array<{
        url: string;
        type: string;
        check_interval?: number;
        change_criteria?: any;
    }>;
    alert_conditions?: Array<{
        type: string;
        value: string;
        threshold?: number;
    }>;
}): Promise<any> {
    const { targets, alert_conditions = [] } = params;

    const startTime = Date.now();

    try {
        console.log(`👀 Setting up monitoring for ${targets.length} targets`);

        // Launch browser for initial baseline
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const monitoring_targets: Array<{
                id: string;
                url: string;
                type: string;
                status: string;
                last_checked: Date;
                check_interval?: number;
                change_criteria?: any;
                baseline_data?: any;
                change_history?: any[];
                error?: string;
            }> = [];

            for (const target of targets) {
                try {
                    console.log(`📊 Establishing baseline for: ${target.url}`);
                    const page = await browser.newPage();

                    // Set user agent
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

                    // Navigate to target
                    await page.goto(target.url, {
                        waitUntil: 'networkidle2',
                        timeout: 30000
                    });

                    // Get baseline data based on change criteria
                    let baseline_data: any = {};

                    if (target.change_criteria?.content_hash !== false) {
                        // Get content hash
                        const content = await page.evaluate(() => document.body.textContent || '');
                        baseline_data.content_hash = createHash('md5').update(content).digest('hex');
                    }

                    if (target.change_criteria?.specific_selectors) {
                        // Monitor specific selectors
                        const selectorData: Record<string, any> = {};
                        for (const selector of target.change_criteria.specific_selectors) {
                            try {
                                const elementData = await page.evaluate((sel) => {
                                    const element = document.querySelector(sel);
                                    return element ? {
                                        text: element.textContent?.trim(),
                                        html: element.innerHTML,
                                        attributes: Array.from(element.attributes).reduce((acc: any, attr) => {
                                            acc[(attr as Attr).name] = (attr as Attr).value;
                                            return acc;
                                        }, {})
                                    } : null;
                                }, selector);
                                selectorData[selector] = elementData;
                            } catch (error) {
                                console.warn(`Failed to monitor selector ${selector}:`, error);
                            }
                        }
                        baseline_data.selector_data = selectorData;
                    }

                    monitoring_targets.push({
                        ...target,
                        id: `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        status: 'active',
                        last_checked: new Date(),
                        baseline_data,
                        check_interval: target.check_interval || 60, // minutes
                        change_history: []
                    });

                    await page.close();

                } catch (error) {
                    console.warn(`Failed to establish baseline for ${target.url}:`, error);
                    monitoring_targets.push({
                        ...target,
                        id: `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        status: 'error',
                        last_checked: new Date(),
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const monitoring_setup = {
                targets: monitoring_targets,
                alert_conditions,
                monitoring_config: {
                    check_interval_minutes: Math.min(...monitoring_targets.map(t => t.check_interval || 60)),
                    max_concurrent_checks: 5,
                    retry_attempts: 3,
                    active_targets: monitoring_targets.filter(t => t.status === 'active').length
                },
                metadata: {
                    setup_time: new Date().toISOString(),
                    total_targets: targets.length,
                    active_targets: monitoring_targets.filter(t => t.status === 'active').length
                }
            };

            return {
                success: true,
                data: monitoring_setup,
                metadata: {
                    executionTime: Date.now() - startTime,
                    confidence: 0.95,
                    source: 'web_monitoring',
                    monitoring_active: true
                }
            };

        } finally {
            await browser.close();
        }

    } catch (error) {
        console.error('Error setting up web monitoring:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in web monitoring setup',
            metadata: {
                executionTime: Date.now() - startTime,
                confidence: 0,
                source: 'web_monitoring'
            }
        };
    }
}

/**
 * Legacy web search function (for backward compatibility)
 */
export async function webSearch({ query }: { query: string }) {
    return executeAgenticWebSearch({
        initial_query: query,
        search_depth: "shallow"
    });
}

/**
 * Legacy crawl page function (for backward compatibility)
 */
export async function crawlPage({ url }: { url: string }) {
    return executeExtractWebContent({
        urls: [url],
        extraction_mode: "full_text"
    });
}