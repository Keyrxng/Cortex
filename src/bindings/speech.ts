/**
 * Speech System Bindings for Agentic Agent
 *
 * Provides a clean interface to the local-stt-tts system for speech processing,
 * following the same architectural patterns and error handling conventions.
 */
import { runWhisper } from "local-stt-tts";
import { textToSpeech as ttsTextToSpeech } from "local-stt-tts";

/**
 * Configuration for speech processing
 */
export interface SpeechConfig {
  transcription?: {
    model?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    language?: string;
    temperature?: number;
    wordTimestamps?: boolean;
  };
  textToSpeech?: {
    voice?: string;
    speed?: number;
    autoPlay?: boolean;
  };
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  transcribedText: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

/**
 * Text-to-speech result
 */
export interface TTSResult {
  filePath: string;
  duration?: number;
  format?: string;
}

/**
 * Transcribe audio file to text
 */
export async function transcribeFromAudio(
  audioPath: string,
  config: SpeechConfig['transcription'] = {}
): Promise<TranscriptionResult | string> {
  try {
    console.log(`🎤 Transcribing audio: ${audioPath}`);

    // Validate input
    if (!audioPath || typeof audioPath !== 'string') {
      throw new Error('Audio path must be a non-empty string');
    }

    // Default configuration
    const defaultConfig = {
      model: 'small' as const,
      language: 'en',
      outputFormat: 'json', // Changed from 'text' to 'txt' to match Whisper's valid formats
      temperature: 0.0,
      wordTimestamps: false,
      ...config
    };

    const result = await runWhisper({
      audioFilePath: audioPath,
      ...defaultConfig
    });

    // Handle different result formats
    if (typeof result === 'string') {
      console.log('✅ Transcription completed (string result)');
      return {
        transcribedText: result,
        confidence: 0.8 // Default confidence
      };
    }

    if (result && typeof result === 'object' && 'transcribedText' in result) {
      console.log('✅ Transcription completed (object result)');
      return result as TranscriptionResult;
    }

    // Fallback for unexpected result format
    console.warn('⚠️  Unexpected transcription result format');
    return {
      transcribedText: String(result || 'Transcription failed'),
      confidence: 0.5
    };

  } catch (error) {
    console.error('❌ Transcription failed:', error);

    // Return fallback result instead of throwing
    return `__TRANSCRIPTION_ERROR__: ${error instanceof Error ? error.message : 'Unknown error'} (audio: ${audioPath})`;
  }
}

/**
 * Convert text to speech
 */
export async function textToSpeech(
  text: string,
  config: SpeechConfig['textToSpeech'] = {}
): Promise<string> {
  try {
    console.log(`🗣️  Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }

    // Default configuration
    const defaultConfig = {
      autoPlay: false,
      ...config
    };

    const result = await ttsTextToSpeech({
      text,
      ...defaultConfig
    });

    // Handle result
    if (result && typeof result === 'object' && 'filePath' in result) {
      const filePath = (result as TTSResult).filePath;
      console.log(`✅ Speech generated: ${filePath}`);
      return filePath;
    }

    // Fallback for unexpected result format
    const fallbackPath = `./agent_reply_${Date.now()}.wav`;
    console.warn(`⚠️  Unexpected TTS result format, using fallback path: ${fallbackPath}`);
    return fallbackPath;

  } catch (error) {
    console.error('❌ Text-to-speech failed:', error);

    // Return fallback path instead of throwing
    const fallbackPath = `./agent_reply_error_${Date.now()}.wav`;
    console.warn(`⚠️  Using fallback audio path: ${fallbackPath}`);
    return fallbackPath;
  }
}

/**
 * Check if speech processing is available
 */
export async function checkSpeechAvailability(): Promise<{
  transcription: boolean;
  textToSpeech: boolean;
  details: Record<string, any>;
}> {
  const result = {
    transcription: false,
    textToSpeech: false,
    details: {} as Record<string, any>
  };

  try {
    // Check if runWhisper is available
    result.transcription = typeof runWhisper === 'function';
    result.details.transcription = 'available';
  } catch (error) {
    result.details.transcription = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  try {
    // Check if textToSpeech is available
    result.textToSpeech = typeof ttsTextToSpeech === 'function';
    result.details.textToSpeech = 'available';
  } catch (error) {
    result.details.textToSpeech = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  return result;
}

/**
 * Speech Processing Bindings for Agentic Agent
 *
 * Provides a clean interface to the agentic-speech system following
 * the same architectural patterns and error handling conventions.
 */