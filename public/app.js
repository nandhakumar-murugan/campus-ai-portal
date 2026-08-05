// ==========================================================================
// CAMPUS AI SUPERCOMPUTER - FRONTEND JAVASCRIPT APP
// Handles WebSocket updates, Canvas topology, Chat UI, Node Opt-In, and VS Code Setup
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // State Management
  const state = {
    nodes: [],
    totals: { activeCount: 0, totalVRAM: 0, totalRAM: 0 },
    totalRequests: 0,
    networkSpeedMbps: 573.5,
    selectedModel: 'deepseek-r1'
  };

  // DOM Elements
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const chatMessages = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const modelSelect = document.getElementById('model-select');
  const systemPrompt = document.getElementById('system-prompt');
  const clearChatBtn = document.getElementById('clear-chat-btn');
  const joinForm = document.getElementById('join-node-form');
  const joinSuccessMsg = document.getElementById('join-success-msg');
  const nodesTableBody = document.getElementById('nodes-table-body');

  // Canvas Context
  const canvas = document.getElementById('topology-canvas');
  const ctx = canvas.getContext('2d');

  // Initialize Navigation Tabs
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'cluster-monitor') {
        resizeCanvas();
      }
    });
  });

  // Model Selector
  modelSelect.addEventListener('change', (e) => {
    state.selectedModel = e.target.value;
  });

  // Quick Prompt Chips
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-prompt')) {
      const promptText = e.target.getAttribute('data-prompt');
      chatInput.value = promptText;
      chatInput.focus();
    }
  });

  // Clear Chat History
  clearChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = `
      <div class="message assistant-msg">
        <div class="msg-avatar">⚡</div>
        <div class="msg-content">
          <h3>Chat Session Cleared</h3>
          <p>Ready for your next prompt on the Campus AI Supercomputer.</p>
        </div>
      </div>
    `;
  });

  // Chat Form Submit Handler
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = chatInput.value.trim();
    if (!prompt) return;

    // Append User Message
    appendMessage('user', prompt);
    chatInput.value = '';

    // Append Assistant Placeholder
    const assistantMsgDiv = appendMessage('assistant', 'Thinking across campus nodes...', true);

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: state.selectedModel,
          messages: [
            { role: 'system', content: systemPrompt.value },
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Update Assistant Message Content
      updateAssistantMessage(assistantMsgDiv, content);
    } catch (err) {
      updateAssistantMessage(assistantMsgDiv, '❌ Error connecting to Campus AI server. Please check your network connection.');
    }
  });

  function appendMessage(role, text, isThinking = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role === 'user' ? 'user-msg' : 'assistant-msg'}`;
    
    const avatar = role === 'user' ? '👤' : '⚡';
    msgDiv.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-content">${formatMarkdown(text)}</div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  function updateAssistantMessage(msgDiv, text) {
    const contentDiv = msgDiv.querySelector('.msg-content');
    contentDiv.innerHTML = formatMarkdown(text);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function formatMarkdown(str) {
    // Simple Code Block Formatter
    let html = str
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="code-block-wrapper"><pre><code>${escapeHtml(code.trim())}</code></pre><button class="btn-copy" onclick="copySnippet(this)">Copy Code</button></div>`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>');
    return html;
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Node Join Form Submission
  joinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('node-name').value,
      type: document.getElementById('device-type').value,
      vramGB: document.getElementById('vram-gb').value,
      ramGB: document.getElementById('ram-gb').value
    };

    try {
      const res = await fetch('/api/cluster/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        joinSuccessMsg.classList.remove('hidden');
        joinForm.reset();
        setTimeout(() => joinSuccessMsg.classList.add('hidden'), 5000);
      }
    } catch (err) {
      alert('Error registering laptop node into cluster.');
    }
  });

  // VS Code Snippet Copy Buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (targetId) {
        const codeText = document.getElementById(targetId).innerText;
        navigator.clipboard.writeText(codeText);
        btn.innerText = 'Copied! ✅';
        setTimeout(() => btn.innerText = 'Copy', 2000);
      }
    });
  });

  // WebSocket Setup for Real-time Cluster State
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'INIT' || data.type === 'CLUSTER_UPDATE') {
      state.nodes = data.nodes;
      state.totals = data.totals;
      state.totalRequests = data.totalRequests;
      updateUI();
    }
  };

  function updateUI() {
    // Update Header Pill Badges
    document.getElementById('active-nodes-count').innerText = `${state.totals.activeCount} Laptops`;
    document.getElementById('sidebar-vram').innerText = `${state.totals.totalVRAM} GB`;
    
    // Update Cluster Monitor Metrics
    document.getElementById('total-nodes-val').innerText = `${state.totals.activeCount} Active Nodes`;
    document.getElementById('total-vram-val').innerText = `${state.totals.totalVRAM} GB`;
    document.getElementById('total-ram-val').innerText = `${state.totals.totalRAM} GB`;

    // Populate Nodes Table
    nodesTableBody.innerHTML = state.nodes.map(n => `
      <tr>
        <td><strong>${n.name}</strong></td>
        <td>${n.type}</td>
        <td><code>${n.ip}</code></td>
        <td>${n.vramGB} GB VRAM / ${n.ramGB} GB RAM</td>
        <td><span class="badge-tag">${n.role}</span></td>
        <td>~${n.latencyMs} ms</td>
        <td><span class="badge-success">${n.status}</span></td>
      </tr>
    `).join('');
  }

  // Interactive HTML5 Canvas Topology Animation
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 320;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let angle = 0;
  function animateTopology() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 70;

    // Draw Coordinator Node in Center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#00F2FE';
    ctx.fill();
    ctx.shadowColor = '#00F2FE';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#0B0F17';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('HOST', centerX, centerY + 4);

    // Draw Worker Nodes on Ring
    const nodeCount = state.nodes.length || 5;
    state.nodes.forEach((node, i) => {
      const nodeAngle = angle + (i * (Math.PI * 2 / nodeCount));
      const nx = centerX + Math.cos(nodeAngle) * radius;
      const ny = centerY + Math.sin(nodeAngle) * radius;

      // Draw Connection Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Pulse Particle along line
      const pulseProgress = (Date.now() / 1500 + i * 0.4) % 1;
      const px = centerX + (nx - centerX) * pulseProgress;
      const py = centerY + (ny - centerY) * pulseProgress;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#9D4EDD';
      ctx.fill();

      // Draw Node Circle
      ctx.beginPath();
      ctx.arc(nx, ny, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Node Label
      ctx.fillStyle = '#F1F5F9';
      ctx.font = '11px Inter';
      ctx.fillText(node.name.split(' ')[0], nx, ny + 30);
    });

    angle += 0.003;
    requestAnimationFrame(animateTopology);
  }

  animateTopology();
});

// Helper for snippet copy inside chat messages
window.copySnippet = function(btn) {
  const code = btn.previousElementSibling.innerText;
  navigator.clipboard.writeText(code);
  btn.innerText = 'Copied! ✅';
  setTimeout(() => btn.innerText = 'Copy Code', 2000);
};
