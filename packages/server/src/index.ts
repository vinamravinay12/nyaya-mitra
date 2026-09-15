/* eslint-disable no-console -- process entry point; startup state must be visible in logs */
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createGeminiClient } from './llm/gemini-client.js';
import { createStubClient } from './llm/stub-client.js';

const config = loadConfig(process.env);
const { geminiApiKey } = config;
const usingStub = geminiApiKey === null;

if (usingStub) {
  console.warn('No GEMINI_API_KEY set — running with the deterministic stub client.');
}

const llm =
  geminiApiKey === null ? createStubClient() : createGeminiClient(geminiApiKey, config.model);

createApp({ llm, config, usingStub }).listen(config.port, () => {
  console.log(`Nyaya Mitra API listening on ${String(config.port)}`);
});
