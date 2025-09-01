#!/usr/bin/env bun

/**
 * VoxMind CLI Entry Point
 *
 * Provides a command-line interface to the VoxMind AI agent system,
 * supporting both text and audio input with intelligent processing.
 */

import { recordAudio } from 'local-stt-tts';
import { AgentRuntime } from './agent/runtime.js';

/**
 * Record audio for agent interaction
 * Uses continuous recording until user stops
 */
async function recordAudioForAgent(): Promise<string> {
  try {
    // Create a temporary file path for the recording
    const tempPath = `./agent_recording_${Date.now()}.wav`;

    // For single request mode, use a 5-second recording instead of interactive mode
    // Interactive mode (-1 seconds) requires spacebar input which doesn't work in single request mode
    const audioPath = await recordAudio({
      seconds: 5, // 5-second recording for single requests
      outputPath: tempPath
    });

    console.log(`✅ Audio recorded: ${audioPath}`);
    return audioPath;

  } catch (error) {
    console.error('❌ Failed to record audio:', error);
    throw new Error(`Audio recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Record audio for interactive mode with spacebar controls
 */
async function recordAudioForInteractive(): Promise<string> {
  try {
    // Create a temporary file path for the recording
    const tempPath = `./agent_interactive_recording_${Date.now()}.wav`;

    // Use interactive mode (-1 seconds) for spacebar controls
    const audioPath = await recordAudio({
      seconds: -1, // Interactive recording with spacebar controls
      outputPath: tempPath
    });

    console.log(`✅ Interactive audio recorded: ${audioPath}`);
    return audioPath;

  } catch (error) {
    console.error('❌ Failed to record interactive audio:', error);
    throw new Error(`Interactive audio recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: any = {
    speak: false,
    verbose: false,
    interactive: false,
    inputMode: null // null means not specified, will be validated
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--text' && args[i+1]) {
      opts.text = args[++i];
    } else if (arg === '--audio') {
      opts.audio = true; // Just a flag, no path needed
    } else if (arg === '--speak') {
      opts.speak = true;
    } else if (arg === '--verbose' || arg === '-v') {
      opts.verbose = true;
    } else if (arg === '--interactive' || arg === '-i') {
      opts.interactive = true;
      // Check for input mode specification
      if (args[i+1] === '--text' || args[i+1] === '--audio') {
        opts.inputMode = args[i+1].substring(2); // Remove '--' prefix
        i++; // Skip the next argument as it's consumed
      }
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return opts;
}

function showHelp() {
  console.log(`
🤖 VoxMind - Voice-Enabled AI Agent System

Usage:
  bun run src/index.ts [options]

Options:
  --text <text>          Process text input
  --audio                Record audio input from microphone
  --speak                Generate audio response
  --verbose, -v          Enable verbose output
  --interactive, -i      Start interactive mode (requires --text or --audio)
  --help, -h             Show this help

Interactive Mode:
  --interactive --text   Interactive mode with text input
  --interactive --audio  Interactive mode with voice input

Examples:
  bun run src/index.ts --text "Help me with a coding problem"
  bun run src/index.ts --audio --speak
  bun run src/index.ts --interactive --text
  bun run src/index.ts --interactive --audio

In text interactive mode, type your messages and 'quit' to exit.
In audio interactive mode, press SPACE to start/stop recording, 'quit' to exit.
`);
}

async function runInteractiveMode(agent: AgentRuntime, inputMode: 'text' | 'audio', verbose: boolean = false) {
  console.log(`🤖 VoxMind Interactive Mode (${inputMode} input)`);
  if (inputMode === 'text') {
    console.log('Type your messages below. Type "quit" to exit.\n');
  } else {
    console.log('Voice input mode: Press SPACE to start/stop recording. Type "quit" to exit.\n');
  }

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  while (true) {
    try {
      let input: string | { text?: string; audio?: string };

      if (inputMode === 'text') {
        const userInput = await askQuestion('You: ');

        if (userInput.toLowerCase() === 'quit' || userInput.toLowerCase() === 'exit') {
          console.log('👋 Goodbye!');
          break;
        }

        if (!userInput.trim()) {
          continue;
        }

        input = userInput;
      } else {
        // Audio input mode
        console.log('🎤 Press SPACE to start recording...');
        const audioPath = await recordAudioForInteractive();
        input = { audio: audioPath };
      }

      console.log('🤔 Processing...');

      const response = await agent.processRequest(input);

      console.log('\n🤖 Agent:', response.content);

      if (verbose && response.reasoning && response.reasoning.length > 0) {
        console.log('\n🧠 Reasoning:');
        response.reasoning.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step.description} (${(step.confidence * 100).toFixed(1)}% confidence)`);
        });
      }

      if (verbose && response.capabilitiesUsed && response.capabilitiesUsed.length > 0) {
        console.log('\n🛠️  Capabilities used:', response.capabilitiesUsed.join(', '));
      }

      if (verbose) {
        console.log(`\n📊 Processing time: ${response.metadata.processingTime}ms`);
        console.log(`🎯 Confidence: ${(response.metadata.confidence * 100).toFixed(1)}%\n`);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      console.log('Please try again.\n');
    }
  }

  rl.close();
}

async function main() {
  const opts = parseArgs();

  // Enable verbose logging if requested
  if (opts.verbose) {
    console.log('🔧 Verbose mode enabled');
  }

  // Validate interactive mode requirements
  if (opts.interactive && !opts.inputMode) {
    console.log('❌ Interactive mode requires specifying input type: --text or --audio');
    showHelp();
    process.exit(1);
  }

  try {
    console.log('🚀 Starting VoxMind...');

    // Initialize the agent
    const agent = new AgentRuntime();

    if (opts.interactive) {
      // Interactive mode
      await runInteractiveMode(agent, opts.inputMode as 'text' | 'audio', opts.verbose);
    } else {
      // Single request mode
      let input: string | { text?: string; audio?: string };

      if (opts.audio) {
        console.log('🎤 Recording audio input from microphone...');
        const audioPath = await recordAudioForAgent();
        input = { audio: audioPath };
      } else if (opts.text) {
        input = opts.text;
        console.log(`📝 Processing text input: "${opts.text}"`);
      } else {
        console.log('❓ No input provided. Use --text, --audio, or --interactive');
        showHelp();
        process.exit(1);
      }

      const response = await agent.processRequest(input);

      console.log('\n=== 🤖 AGENT RESPONSE ===');
      console.log(response.content);

      if (opts.verbose) {
        if (response.reasoning && response.reasoning.length > 0) {
          console.log('\n🧠 REASONING STEPS:');
          response.reasoning.forEach((step, i) => {
            console.log(`  ${i + 1}. ${step.type.toUpperCase()}: ${step.description}`);
            console.log(`     Confidence: ${(step.confidence * 100).toFixed(1)}%`);
          });
        }

        if (response.capabilitiesUsed && response.capabilitiesUsed.length > 0) {
          console.log('\n🛠️  CAPABILITIES USED:');
          response.capabilitiesUsed.forEach(cap => console.log(`  • ${cap}`));
        }

        console.log('\n📊 METADATA:');
        console.log(`  Processing Time: ${response.metadata.processingTime}ms`);
        console.log(`  Confidence: ${(response.metadata.confidence * 100).toFixed(1)}%`);
      }

      if (response.audioPath) {
        console.log(`\n🎵 Audio response saved to: ${response.audioPath}`);
      }

      console.log('\n✨ Request completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
