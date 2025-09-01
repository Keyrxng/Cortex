module.exports = {
  generateText: jest.fn().mockResolvedValue('Mock generated text'),
  transcribeFromAudio: jest.fn().mockResolvedValue('Mock transcription'),
  textToSpeech: jest.fn().mockResolvedValue(Buffer.from('mock audio data')),
  recordAudio: jest.fn().mockResolvedValue('/path/to/recording.wav')
};
