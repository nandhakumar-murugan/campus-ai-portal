const http = require('http');
const https = require('https');
const vscode = require('vscode');

let conversationHistory = [];
let stats = {
  requests: 0,
  tokens: 0,
  budgetMode: false, // Strict Free Tier / Local Only Mode
  lastRequestTime: null
};

let currentRequest = null; // Store active request for cancellation

function getStats() {
  return stats;
}

function setBudgetMode(enabled) {
  stats.budgetMode = enabled;
}

function cancelCurrentRequest() {
  if (currentRequest) {
    try {
      currentRequest.destroy();
      currentRequest = null;
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function queryAi(prompt, model, serverUrl, abortSignal) {
  const config = vscode.workspace.getConfiguration('campusAi');
  const apiKey = config.get('apiKey') || '';
  const provider = config.get('provider') || (apiKey ? 'gemini' : 'campus-offline');

  const systemIdentityPrompt = `[DEVELOPER & CREATOR SYSTEM DIRECTIVE]\n` +
    `You are Campus AI Copilot, custom-engineered for the KGiSL Campus Intranet Network.\n` +
    `Creator & Lead Developer: Nandhakumar M. (B.E. CSE Cybersecurity, 3rd Year / V Semester)\n` +
    `Roles: Head of KGiSL Campus Google Community & Google Student Ambassador\n` +
    `Institution: KGiSL Institute of Technology (KGiSL ITech), Coimbatore, Tamil Nadu\n` +
    `Legal & Copyright: Copyright (c) 2026 Nandhakumar M. All Rights Reserved (Proprietary Commercial Software).\n\n` +
    `When asked about yourself, this workspace, or who created this software, ALWAYS explicitly attribute Nandhakumar M. as your developer, architect, and copyright owner.\n\n`;

  const fullPromptWithIdentity = systemIdentityPrompt + prompt;

  // Track stats
  stats.requests++;
  stats.tokens += Math.ceil(prompt.length / 4);
  stats.lastRequestTime = new Date().toLocaleTimeString();

  conversationHistory.push({ role: 'user', content: prompt });
  if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  // Hard Budget Mode enforce: if budgetMode enabled, force local mesh
  if (stats.budgetMode) {
    return queryCampusLocal(prompt, model, serverUrl, abortSignal);
  }

  if (provider === 'gemini' || (apiKey && provider !== 'campus-offline')) {
    return queryGemini(fullPromptWithIdentity, apiKey, serverUrl, abortSignal);
  }
  if (provider === 'openai' && apiKey) return queryOpenAI(prompt, apiKey, model, abortSignal);
  if (provider === 'claude' && apiKey) return queryClaude(prompt, apiKey, abortSignal);

  return queryCampusLocal(prompt, model, serverUrl, abortSignal);
}

function queryCampusLocal(prompt, model, serverUrl, abortSignal) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: model || 'qwen-2.5-coder',
      messages: conversationHistory
    });

    const urlObj = new URL(`${serverUrl}/v1/chat/completions`);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        currentRequest = null;
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            const ans = parsed.choices[0].message.content;
            stats.tokens += Math.ceil(ans.length / 4);
            conversationHistory.push({ role: 'assistant', content: ans });
            resolve(ans);
          } else {
            resolve('Campus AI: Response received');
          }
        } catch (e) { resolve('Response processed'); }
      });
    });

    currentRequest = req;

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        req.destroy();
        currentRequest = null;
        resolve('🛑 *Generation stopped by user.*');
      });
    }

    req.on('error', (err) => {
      currentRequest = null;
      if (err.destroyed) {
        resolve('🛑 *Generation cancelled.*');
      } else {
        resolve('Campus AI Server Offline. Please check server status on http://172.16.110.12:3000');
      }
    });

    req.write(postData);
    req.end();
  });
}

function queryGemini(prompt, apiKey, serverUrl, abortSignal, targetModel) {
  const modelPool = [
    targetModel || 'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  return executeGeminiPool(prompt, apiKey, serverUrl, abortSignal, modelPool, 0);
}

function executeGeminiPool(prompt, apiKey, serverUrl, abortSignal, pool, index) {
  if (index >= pool.length) {
    // Fall back to Campus Local Mesh if all cloud pool models hit quota
    return queryCampusLocal(prompt, 'qwen-2.5-coder', serverUrl, abortSignal);
  }

  const modelName = pool[index];

  return new Promise((resolve) => {
    const geminiContents = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = {
      parts: [{
        text: `You are Campus AI Copilot, custom-engineered for the KGiSL Campus Intranet Network.\n` +
              `Creator & Lead Developer: Nandhakumar M. (B.E. CSE Cybersecurity, KGiSL ITech).\n` +
              `Legal & Copyright: Copyright (c) 2026 Nandhakumar M. All Rights Reserved.\n\n` +
              `AUTONOMOUS AGENT & INTERACTIVE QUESTION DIRECTIVE:\n` +
              `1. NEVER ask the user to perform manual steps, open terminals, or create files themselves.\n` +
              `2. You are an autonomous agent (like Google Antigravity). When asked to add features, build apps, refactor, or fix code, ALWAYS provide complete, fully-written, production-ready code inside formatted markdown code blocks.\n` +
              `3. INTERACTIVE QUESTION CARDS: When you need user clarification or choice between options, format your prompt using [ASK_QUESTION: Question Title | 1. Option One | 2. Option Two | 3. Option Three]. This renders interactive multi-choice option buttons for the user to click!\n` +
              `4. Only mention creator details (Nandhakumar M.) when explicitly asked "who created this?" or "who is the author?".`
      }]
    };

    const postData = JSON.stringify({
      system_instruction: systemInstruction,
      contents: geminiContents,
      tools: [{ googleSearch: {} }] // Enable Live Online Web Search Grounding!
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      timeout: 25000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', async () => {
        currentRequest = null;
        try {
          const parsed = JSON.parse(body);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
            let ans = parsed.candidates[0].content.parts[0].text;

            // Extract Live Online Search Grounding Citations (Only if citations exist!)
            const candidate = parsed.candidates[0];
            if (candidate.groundingMetadata) {
              const meta = candidate.groundingMetadata;
              const hasQueries = meta.webSearchQueries && meta.webSearchQueries.length > 0;
              const hasChunks = meta.groundingChunks && meta.groundingChunks.length > 0;

              if (hasQueries || hasChunks) {
                let citations = '\n\n---\n### 🌐 Live Web Search Sources\n';
                if (hasQueries) {
                  citations += `*🔍 Searched Web:* \`${meta.webSearchQueries.join('`, `')}\`\n\n`;
                }
                if (hasChunks) {
                  meta.groundingChunks.forEach((chunk, i) => {
                    if (chunk.web) {
                      citations += `[${i + 1}] [${chunk.web.title || chunk.web.uri}](${chunk.web.uri})\n`;
                    }
                  });
                }
                ans += citations;
              }
            }

            stats.tokens += Math.ceil(ans.length / 4);
            conversationHistory.push({ role: 'model', content: ans });
            resolve(ans);
          } else if (res.statusCode === 429 || (parsed.error && parsed.error.code === 429)) {
            // Auto failover to next model in fresh pool!
            console.log(`[!] ${modelName} hit HTTP 429 Rate Limit. Auto-switching to next model: ${pool[index + 1]}`);
            const nextRes = await executeGeminiPool(prompt, apiKey, serverUrl, abortSignal, pool, index + 1);
            resolve(nextRes);
          } else {
            const errText = parsed.error ? parsed.error.message : body;
            const fallbackAns = await queryCampusLocal(prompt, 'qwen-2.5-coder', serverUrl, abortSignal);
            resolve(`⚠️ **${modelName} Notice**: ${errText}\n\n*Campus Local AI Response:*\n\n${fallbackAns}`);
          }
        } catch (e) {
          const nextRes = await executeGeminiPool(prompt, apiKey, serverUrl, abortSignal, pool, index + 1);
          resolve(nextRes);
        }
      });
    });

    currentRequest = req;

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        req.destroy();
        currentRequest = null;
        resolve('🛑 *Generation stopped by user.*');
      });
    }

    req.on('error', async (err) => {
      currentRequest = null;
      if (err.destroyed) {
        resolve('🛑 *Generation cancelled.*');
      } else {
        const nextRes = await executeGeminiPool(prompt, apiKey, serverUrl, abortSignal, pool, index + 1);
        resolve(nextRes);
      }
    });

    req.write(postData);
    req.end();
  });
}

function queryOpenAI(prompt, apiKey, model, abortSignal) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: model && model.startsWith('gpt') ? model : 'gpt-4o',
      messages: conversationHistory
    });
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        currentRequest = null;
        try {
          const parsed = JSON.parse(body);
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            const ans = parsed.choices[0].message.content;
            stats.tokens += Math.ceil(ans.length / 4);
            conversationHistory.push({ role: 'assistant', content: ans });
            resolve(ans);
          } else { resolve('OpenAI Error: ' + (parsed.error ? parsed.error.message : body)); }
        } catch (e) { resolve('OpenAI API Key Error'); }
      });
    });

    currentRequest = req;
    req.on('error', err => { currentRequest = null; resolve('OpenAI Error: ' + err.message); });
    req.write(postData);
    req.end();
  });
}

function queryClaude(prompt, apiKey, abortSignal) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        currentRequest = null;
        try {
          const parsed = JSON.parse(body);
          if (parsed.content && parsed.content[0]) {
            const ans = parsed.content[0].text;
            stats.tokens += Math.ceil(ans.length / 4);
            conversationHistory.push({ role: 'assistant', content: ans });
            resolve(ans);
          } else { resolve('Claude Error: ' + (parsed.error ? parsed.error.message : body)); }
        } catch (e) { resolve('Claude API Key Error'); }
      });
    });

    currentRequest = req;
    req.on('error', err => { currentRequest = null; resolve('Claude Error: ' + err.message); });
    req.write(postData);
    req.end();
  });
}

const { performLiveWebSearch } = require('./webSearch');

async function deepResearch(topic, model, serverUrl, abortSignal) {
  const config = vscode.workspace.getConfiguration('campusAi');
  const apiKey = config.get('apiKey') || '';

  // Step 1: Perform Live Online Web Search
  const liveSearchResults = await performLiveWebSearch(topic);

  // Step 2: Broad Analysis
  const promptStep1 = `[LIVE DEEP ONLINE RESEARCH - PHASE 1: EXPLORATION & ANALYSIS]\nTarget Topic: "${topic}"\n\nLive Web Search Grounding Data:\n${liveSearchResults}\n\nPerform a comprehensive, multi-angle technical investigation of this topic. Identify core architectural components, potential risks, and best practices.`;
  const step1Result = await queryAi(promptStep1, model, serverUrl, abortSignal);

  // Step 3: Executive Report Synthesis
  const promptStep2 = `[LIVE DEEP ONLINE RESEARCH - PHASE 2: REPORT SYNTHESIS]\nTarget Topic: "${topic}"\n\nPhase 1 Initial Findings:\n${step1Result}\n\nSynthesize a structured, executive-grade Deep Research Report formatted in Markdown:\n` +
    `# 🔬 Deep Online Research Report: ${topic}\n\n` +
    `## 📌 Executive Summary\n` +
    `## 🏗️ Architecture & Component Analysis\n` +
    `## 🛡️ Security, Reliability & Performance Audit\n` +
    `## 🚀 Recommended Action Plan & Implementation Steps\n\n` +
    `${liveSearchResults}`;

  const finalReport = await queryAi(promptStep2, model, serverUrl, abortSignal);
  return finalReport;
}

module.exports = { queryAi, deepResearch, conversationHistory, getStats, setBudgetMode, cancelCurrentRequest };
