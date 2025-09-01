# VoxMind: Voice-Enabled AI Agent System

> **⚠️ Research Project Notice**: This is an experimental research project exploring voice-enabled AI agents with integrated memory and reasoning capabilities. It combines two of my other projects (local-stt-tts and agentic-memory)

## Overview

VoxMind is a TypeScript-based research implementation of a sophisticated voice-enabled AI agent system that combines speech processing, intelligent memory management, and multi-modal reasoning capabilities. This project explores the intersection of voice AI, knowledge graphs, and agentic systems, implementing techniques from recent research breakthroughs.

The system demonstrates advanced AI agent capabilities including:
- **Voice Interaction**: Speech-to-text and text-to-speech using local models
- **Intelligent Memory**: Integration with GraphRAG memory systems for contextual understanding
- **Multi-Modal Reasoning**: Advanced planning and decision-making with tool execution
- **Extensible Architecture**: Plugin-based tool system for file operations, web search, and Git management
- **12-Factor Agent Principles**: Stateless, scalable design following modern AI architecture patterns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- TypeScript 5.0+
- Access to `local-stt-tts` and `agentic-memory` projects

### Installation
```bash
# Clone the repository
git clone https://github.com/keyrxng/VoxMind.git
cd VoxMind

# Install dependencies
npm install
# or with Bun
bun install

# Link to required projects (if using local development)
bun link local-stt-tts
bun link agentic-memory

# Build the project
npm run build
# or
bun run build
```

### Running the Agent
```bash
# Text-based interaction
bun run src/index.ts --text "Help me with a coding problem"

# Voice-based interaction
bun run src/index.ts --audio --speak

# Interactive mode with text
bun run src/index.ts --interactive --text

# Interactive mode with voice
bun run src/index.ts --interactive --audio
```

## 🏗️ Architecture

VoxMind is built around several core components that integrate with your existing projects:

### Core Agent Runtime
- **AgentRuntime**: Main reasoning and planning engine with capability management
- **ConversationManager**: Context-aware conversation handling and memory integration
- **MetricsTracker**: Performance monitoring and system health tracking

### Speech Processing Integration
- **Speech Bindings**: Clean interface to `local-stt-tts` for audio processing
- **Audio Recording**: Interactive voice input with spacebar controls
- **Text-to-Speech**: Local TTS generation for voice responses

### Memory Integration
- **Memory Bindings**: Seamless integration with `agentic-memory` GraphRAG system
- **Contextual Reasoning**: Leverages temporal knowledge graphs for intelligent responses
- **Entity Clustering**: Semantic grouping of related memories for better context

### Tool System
- **File Operations**: Search, create, modify, and manage files intelligently
- **Web Search**: Agentic web search with content extraction and monitoring
- **Git Operations**: Smart Git workflows with automated code review capabilities

## 🔗 Project Integration

VoxMind is designed as the central orchestrator that brings together your research projects:

### local-stt-tts Integration
- **Speech Processing**: Uses local Whisper models for transcription
- **TTS Generation**: Local text-to-speech for voice responses
- **Audio Management**: Handles recording, processing, and playback

### agentic-memory Integration
- **Knowledge Storage**: Leverages GraphRAG memory system for context
- **Entity Resolution**: Intelligent memory querying and relationship mapping
- **Temporal Reasoning**: Context-aware responses based on conversation history

## 📚 Key Research Implementations

This project implements several cutting-edge research findings:

### 1. Voice-Enabled AI Agents
Research shows that voice interaction significantly improves AI agent usability and accessibility. This project implements local speech processing to avoid external API dependencies while maintaining high quality.

### 2. Multi-Modal Reasoning
Combines speech, text, and memory modalities for sophisticated reasoning. Implements planning algorithms that can switch between input/output modes seamlessly.

### 3. Tool-Using Agents
Based on recent research in tool-using AI systems, implements a plugin architecture that allows the agent to execute complex tasks through specialized tools.

### 4. Context-Aware Memory
Integrates with temporal knowledge graphs to provide context-aware responses that evolve based on conversation history and user preferences.

## 🧪 Examples & Usage

### Basic Voice Interaction
```typescript
import { AgentRuntime } from './src/agent/runtime.js';

const agent = new AgentRuntime();

// Process voice input
const response = await agent.processRequest({ 
  audio: 'path/to/recording.wav' 
});

console.log('Agent response:', response.content);
```

### Tool Execution
```typescript
// The agent can automatically use tools based on user requests
const response = await agent.processRequest(
  "Search for files containing 'GraphRAG' and then create a summary"
);

// Agent will automatically:
// 1. Use file search tool
// 2. Process results
// 3. Generate summary
// 4. Provide response
```

### Memory Integration
```typescript
// Agent automatically stores and retrieves context
await agent.processRequest("Remember that I'm working on a TypeScript project");
await agent.processRequest("What was I working on?");

// Agent recalls: "You mentioned you're working on a TypeScript project"
```

## 📊 Performance Characteristics

Based on research implementations:

- **Speech Processing**: Local Whisper models with configurable quality/speed tradeoffs
- **Response Generation**: Sub-second reasoning for most queries
- **Memory Integration**: Real-time GraphRAG querying with temporal context
- **Tool Execution**: Parallel tool execution with intelligent error handling
- **Scalability**: Memory-bounded processing with configurable limits

## 🚧 Current Limitations

As a research project, this implementation has several limitations:

- **Experimental Status**: Not production-ready, primarily for research and learning
- **Local Dependencies**: Requires local speech models and sufficient computational resources
- **Tool Coverage**: Limited to implemented tools (file system, web search, Git operations)
- **Memory Constraints**: Dependent on agentic-memory system for knowledge storage

## 🤝 Contributing

This is a research project, but contributions are welcome! Areas of interest:

- **Tool Development**: New agent capabilities and integrations
- **Speech Processing**: Improvements to voice interaction quality
- **Reasoning Algorithms**: Better planning and decision-making logic
- **Memory Integration**: Enhanced context awareness and temporal reasoning
- **Documentation**: Better examples, tutorials, or research summaries

## 📄 License

This project is released under the MIT License. See [LICENSE](LICENSE) for details.

---

**Note**: This project represents ongoing research and may not reflect the current state of the field. Always refer to the latest research papers for the most up-to-date techniques and findings.
