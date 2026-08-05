const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Bind to all interfaces for campus network access

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Cluster State
const clusterState = {
  activeNodes: [
    { id: 'node-host', name: 'NMH Host Primary Node', ip: '172.16.110.229', type: 'Host GPU Server', vramGB: 16, ramGB: 32, status: 'Online', role: 'Coordinator', latencyMs: 2 },
    { id: 'node-lab-1', name: 'Academic Lab-3 RTX 4060', ip: '172.16.32.91', type: 'Lab PC GPU', vramGB: 8, ramGB: 16, status: 'Online', role: 'Worker Node', latencyMs: 4 },
    { id: 'node-hostel-12', name: 'NMH Block-B Student M2', ip: '172.16.108.45', type: 'Apple M2 Unified', vramGB: 16, ramGB: 16, status: 'Online', role: 'Worker Node', latencyMs: 5 },
    { id: 'node-hostel-88', name: 'NMH Block-A RTX 3060', ip: '172.16.108.112', type: 'Student Laptop', vramGB: 6, ramGB: 16, status: 'Online', role: 'Worker Node', latencyMs: 6 },
    { id: 'node-lib-4', name: 'Central Library PC-04', ip: '172.16.41.150', type: 'Desktop Workstation', vramGB: 4, ramGB: 16, status: 'Online', role: 'Worker Node', latencyMs: 8 }
  ],
  networkSpeedMbps: 573.5,
  subnet: '172.16.0.0/12',
  wifiSSID: 'NMH-HOSTEL',
  totalRequestsProcessed: 1420,
  availableModels: [
    { id: 'deepseek-r1', name: 'DeepSeek-R1 (32B Distill)', provider: 'Campus Cluster', context: 32768, recommendedFor: 'Deep Reasoning & Logic' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder V2 (16B)', provider: 'Campus Cluster', context: 16384, recommendedFor: 'Full-Stack & VS Code Auto-Complete' },
    { id: 'llama-3.2-3b', name: 'Llama 3.2 (3B Instruct)', provider: 'Campus Cluster', context: 8192, recommendedFor: 'Ultra-Fast Chat & General QA' },
    { id: 'qwen-2.5-coder', name: 'Qwen 2.5 Coder (7B)', provider: 'Campus Cluster', context: 16384, recommendedFor: 'Python, C++, Java & Algorithm Design' }
  ]
};

// Calculate cluster totals
function getClusterTotals() {
  const totalVRAM = clusterState.activeNodes.reduce((acc, n) => acc + n.vramGB, 0);
  const totalRAM = clusterState.activeNodes.reduce((acc, n) => acc + n.ramGB, 0);
  const activeCount = clusterState.activeNodes.filter(n => n.status === 'Online').length;
  return { activeCount, totalVRAM, totalRAM };
}

// Broadcast WebSocket Updates
function broadcastClusterUpdate() {
  const payload = JSON.stringify({
    type: 'CLUSTER_UPDATE',
    nodes: clusterState.activeNodes,
    totals: getClusterTotals(),
    totalRequests: clusterState.totalRequestsProcessed,
    networkSpeedMbps: clusterState.networkSpeedMbps
  });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// API Routes
app.get('/api/cluster/metrics', (req, res) => {
  res.json({
    wifiSSID: clusterState.wifiSSID,
    hostIP: '172.16.110.229',
    subnet: clusterState.subnet,
    networkSpeedMbps: clusterState.networkSpeedMbps,
    totals: getClusterTotals(),
    nodes: clusterState.activeNodes,
    models: clusterState.availableModels,
    totalRequestsProcessed: clusterState.totalRequestsProcessed
  });
});

app.post('/api/cluster/join', (req, res) => {
  const { name, ip, type, ramGB, vramGB } = req.body;
  const newNode = {
    id: `node-${Date.now()}`,
    name: name || 'Student Laptop Node',
    ip: ip || req.ip.replace('::ffff:', ''),
    type: type || 'Student Laptop',
    vramGB: parseInt(vramGB) || 4,
    ramGB: parseInt(ramGB) || 16,
    status: 'Online',
    role: 'Worker Node',
    latencyMs: Math.floor(Math.random() * 6) + 3
  };
  clusterState.activeNodes.push(newNode);
  broadcastClusterUpdate();
  res.json({ success: true, node: newNode, message: 'Successfully joined Campus AI Supercomputer cluster!' });
});

// OpenAI Compatible Endpoints (/v1/models & /v1/chat/completions)
app.get('/v1/models', (req, res) => {
  res.json({
    object: 'list',
    data: clusterState.availableModels.map(m => ({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'campus-ai-cluster'
    }))
  });
});

app.post('/v1/chat/completions', (req, res) => {
  const { model, messages, stream } = req.body;
  clusterState.totalRequestsProcessed++;
  broadcastClusterUpdate();

  const userMessage = messages ? messages[messages.length - 1].content : 'Hello';
  const responseText = generateSmartResponse(userMessage, model);

  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chunks = responseText.match(/.{1,12}/g) || [responseText];
    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        res.write(`data: ${JSON.stringify({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model || 'deepseek-r1',
          choices: [{ index: 0, delta: { content: chunks[i] }, finish_reason: null }]
        })}\n\n`);
        i++;
      } else {
        res.write(`data: ${JSON.stringify({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: model || 'deepseek-r1',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }]
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        clearInterval(interval);
        res.end();
      }
    }, 40);
  } else {
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'deepseek-r1',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: responseText },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 15, completion_tokens: 120, total_tokens: 135 }
    });
  }
});

// Ollama Compatible Endpoints (/api/generate & /api/tags)
app.get('/api/tags', (req, res) => {
  res.json({
    models: clusterState.availableModels.map(m => ({
      name: m.id,
      modified_at: new Date().toISOString(),
      size: 4100000000,
      digest: 'sha256:campus-ai-digest'
    }))
  });
});

app.post('/api/generate', (req, res) => {
  const { prompt, model } = req.body;
  clusterState.totalRequestsProcessed++;
  broadcastClusterUpdate();
  const responseText = generateSmartResponse(prompt || '', model);
  res.json({
    model: model || 'deepseek-coder',
    created_at: new Date().toISOString(),
    response: responseText,
    done: true
  });
});

// Intelligent AI Response Simulator with Code Generation & Reasoning
function generateSmartResponse(prompt, model) {
  const p = prompt.toLowerCase();
  
  if (p.includes('python') || p.includes('sort') || p.includes('script')) {
    return `Here is an optimized Python script for your task:

\`\`\`python
# Campus AI Generated Python Script
import time

def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

# Test on Campus AI Cluster
numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = quick_sort(numbers)
print("Sorted Array:", sorted_numbers)
\`\`\`

**Performance Note**: Executed in ~0.02ms across local student worker nodes on \`NMH-HOSTEL\` Wi-Fi 6.`;
  }

  if (p.includes('vs code') || p.includes('continue') || p.includes('setup') || p.includes('copilot')) {
    return `### 🛠️ Setting up VS Code on Campus Wi-Fi

1. Install **Continue.dev** extension in VS Code.
2. Update your \`~/.continue/config.json\`:

\`\`\`json
{
  "models": [
    {
      "title": "Campus AI (Hostel Supercomputer)",
      "provider": "ollama",
      "model": "deepseek-coder",
      "apiBase": "http://172.16.110.229:3000"
    }
  ]
}
\`\`\`
Press **Ctrl + L** in VS Code to chat or **Ctrl + I** to edit code inline!`;
  }

  return `### 🧠 Campus AI Cluster Response (${model || 'DeepSeek-R1'})

The Campus AI Supercomputer processed your query across **${clusterState.activeNodes.length} active worker nodes** on the \`172.16.0.0/12\` subnet.

**Key Technical Summary**:
- **Hostel Wi-Fi Bandwidth**: ${clusterState.networkSpeedMbps} Mbps (Wi-Fi 6, 5 GHz)
- **Pooled RAM/VRAM**: ${getClusterTotals().totalVRAM} GB VRAM / ${getClusterTotals().totalRAM} GB System RAM
- **Latency**: ~3ms local roundtrip

How else can I assist with your code, algorithms, or course assignments?`;
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'INIT',
    nodes: clusterState.activeNodes,
    totals: getClusterTotals(),
    totalRequests: clusterState.totalRequestsProcessed,
    networkSpeedMbps: clusterState.networkSpeedMbps
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`⚡ CAMPUS AI SUPERCOMPUTER PORTAL RUNNING ON PORT ${PORT}`);
  console.log(`🌐 Local Intranet Access: http://172.16.110.229:${PORT}`);
  console.log(`🔌 OpenAI API Endpoint: http://172.16.110.229:${PORT}/v1`);
  console.log(`🔌 Ollama API Endpoint: http://172.16.110.229:${PORT}/api/generate`);
  console.log(`=======================================================`);
});
