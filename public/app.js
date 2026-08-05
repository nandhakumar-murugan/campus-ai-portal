// ==========================================================================
// CAMPUS AI SUPERCOMPUTER - REAL-TIME FRONTEND APPLICATION
// Handles WebSocket live metrics, real ARP topology canvas, chat UI, node opt-in, & VS Code setups
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  
  // Real-Time System State
  const state = {
    hostIP: window.location.hostname || '172.16.110.229',
    nodes: [],
    totals: { activeCount: 0, totalVRAM: 0, totalRAM: 0 },
    sys: { cpuUsagePercent: 0, ramUsagePercent: 0, totalRAMGB: 0, freeRAMGB: 0, usedRAMGB: 0, cpuCores: 0, cpuModel: '' },
    totalRequests: 0,
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

  const canvas = document.getElementById('topology-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  // Auto-detect visiting student device hardware
  if (navigator.deviceMemory) {
    const ramSelect = document.getElementById('ram-gb');
    if (ramSelect) ramSelect.value = Math.min(64, Math.max(8, navigator.deviceMemory));
  }

  // Navigation Tab Switching
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const pane = document.getElementById(targetTab);
      if (pane) pane.classList.add('active');

      if (targetTab === 'cluster-monitor' && canvas) {
        resizeCanvas();
      }
    });
  });

  // Model Selector
  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      state.selectedModel = e.target.value;
    });
  }

  // Quick Prompt Chips
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-prompt')) {
      const promptText = e.target.getAttribute('data-prompt');
      if (chatInput) {
        chatInput.value = promptText;
        chatInput.focus();
      }
    }
  });

  // Clear Chat History
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      chatMessages.innerHTML = `
        <div class="message assistant-msg">
          <div class="msg-avatar">⚡</div>
          <div class="msg-content">
            <h3>Chat Session Cleared</h3>
            <p>Ready for your next real-time prompt on the Campus AI Supercomputer.</p>
          </div>
        </div>
      `;
    });
  }

  // Chat Form Submission
  if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prompt = chatInput.value.trim();
      if (!prompt) return;

      appendMessage('user', prompt);
      chatInput.value = '';

      const assistantMsgDiv = appendMessage('assistant', 'Evaluating prompt across real active subnet nodes...', true);

      try {
        const response = await fetch('/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: state.selectedModel,
            messages: [
              { role: 'system', content: systemPrompt.value },
              { role: 'user', content: prompt }
            ]
          })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        updateAssistantMessage(assistantMsgDiv, content);
      } catch (err) {
        updateAssistantMessage(assistantMsgDiv, '❌ Error connecting to Campus AI server. Please check your intranet Wi-Fi connection.');
      }
    });
  }

  function appendMessage(role, text) {
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
    if (contentDiv) {
      contentDiv.innerHTML = formatMarkdown(text);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function formatMarkdown(str) {
    return str
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<div class="code-block-wrapper"><pre><code>${escapeHtml(code.trim())}</code></pre><button class="btn-copy" onclick="copySnippet(this)">Copy Code</button></div>`;
      })
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '<br><br>');
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Node Join Form Submission
  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('node-name').value,
        type: document.getElementById('device-type').value,
        vramGB: document.getElementById('vram-gb').value,
        ramGB: document.getElementById('ram-gb').value,
        userAgent: navigator.userAgent
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
        alert('Error registering laptop node into real cluster.');
      }
    });
  }

  // VS Code Snippet Copy Buttons & Dynamic IP Injection
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (targetId) {
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          const codeText = targetElem.innerText;
          navigator.clipboard.writeText(codeText);
          btn.innerText = 'Copied! ✅';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        }
      }
    });
  });

  // WebSocket Connection for Real-Time State
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'REALTIME_UPDATE') {
      state.hostIP = data.hostIP || window.location.hostname;
      state.nodes = data.nodes || [];
      state.totals = data.totals || { activeCount: 0, totalVRAM: 0, totalRAM: 0 };
      state.sys = data.sys || {};
      state.totalRequests = data.totalRequestsProcessed || 0;
      updateRealtimeUI();
    }
  };

  function updateRealtimeUI() {
    // 1. Update Header Pills with REAL System & Network Data
    const hostIpElem = document.getElementById('host-ip');
    if (hostIpElem) hostIpElem.innerText = state.hostIP;

    const activeNodesElem = document.getElementById('active-nodes-count');
    if (activeNodesElem) activeNodesElem.innerText = `${state.totals.activeCount} Real Devices`;

    // 2. Update Sidebar Real-Time Metrics
    const liveCpuElem = document.getElementById('live-cpu');
    if (liveCpuElem) liveCpuElem.innerText = `${state.sys.cpuUsagePercent}% (${state.sys.cpuCores} Cores)`;

    const sidebarRamElem = document.getElementById('sidebar-vram');
    if (sidebarRamElem) sidebarRamElem.innerText = `${state.sys.freeRAMGB} GB Free / ${state.sys.totalRAMGB} GB`;

    // 3. Update Cluster Monitor Page Cards
    const totalNodesVal = document.getElementById('total-nodes-val');
    if (totalNodesVal) totalNodesVal.innerText = `${state.totals.activeCount} Subnet Nodes`;

    const totalVramVal = document.getElementById('total-vram-val');
    if (totalVramVal) totalVramVal.innerText = `${state.sys.freeRAMGB} GB Free`;

    const totalRamVal = document.getElementById('total-ram-val');
    if (totalRamVal) totalRamVal.innerText = `${state.sys.totalRAMGB} GB Total`;

    const cpuUsageVal = document.getElementById('cpu-usage-val');
    if (cpuUsageVal) cpuUsageVal.innerText = `${state.sys.cpuUsagePercent}%`;

    // 4. Update Connected Nodes Table with REAL ARP Data
    if (nodesTableBody) {
      nodesTableBody.innerHTML = state.nodes.map(n => `
        <tr>
          <td><strong>${escapeHtml(n.name)}</strong></td>
          <td>${escapeHtml(n.type)}</td>
          <td><code>${n.ip}</code></td>
          <td>${n.ramGB || 16} GB RAM / ${n.vramGB || 4} GB VRAM</td>
          <td><span class="badge-tag">${n.role}</span></td>
          <td>~${n.latencyMs} ms</td>
          <td><span class="badge-success">${n.status}</span></td>
        </tr>
      `).join('');
    }

    // 5. Update VS Code Config Blocks with REAL Host IP
    const currentIP = state.hostIP;
    const codeContinue = document.getElementById('code-continue');
    if (codeContinue) {
      codeContinue.innerText = `{
  "models": [
    {
      "title": "Campus AI (${state.sys.hostname})",
      "provider": "ollama",
      "model": "deepseek-coder",
      "apiBase": "http://${currentIP}:3000"
    }
  ]
}`;
    }

    const codePython = document.getElementById('code-python');
    if (codePython) {
      codePython.innerText = `from openai import OpenAI

client = OpenAI(
    base_url="http://${currentIP}:3000/v1",
    api_key="campus-ai"
)

response = client.chat.completions.create(
    model="deepseek-coder",
    messages=[{"role": "user", "content": "Write a Python script"}]
)

print(response.choices[0].message.content)`;
    }

    const codeCurl = document.getElementById('code-curl');
    if (codeCurl) {
      codeCurl.innerText = `curl http://${currentIP}:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-coder",
    "messages": [{"role": "user", "content": "Explain Quicksort"}]
  }'`;
    }
  }

  // Real-Time Canvas Topology Animation (Drawing Real Discovered IPs)
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 320;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let angle = 0;
  function animateTopology() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 70;

    // Draw Host Node in Center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#00F2FE';
    ctx.fill();
    ctx.shadowColor = '#00F2FE';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#0B0F17';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('HOST PC', centerX, centerY - 2);
    ctx.fillText(state.hostIP, centerX, centerY + 10);

    // Draw REAL Discovered Nodes around the ring
    const realNodes = state.nodes.length > 0 ? state.nodes : [{ name: 'Host', ip: state.hostIP }];
    const nodeCount = realNodes.length;

    realNodes.forEach((node, i) => {
      const nodeAngle = angle + (i * (Math.PI * 2 / nodeCount));
      const nx = centerX + Math.cos(nodeAngle) * radius;
      const ny = centerY + Math.sin(nodeAngle) * radius;

      // Draw Connection Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Signal Pulse along Line
      const pulseProgress = (Date.now() / 1200 + i * 0.5) % 1;
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

      // Node Label (REAL IP Address)
      ctx.fillStyle = '#F1F5F9';
      ctx.font = '11px Fira Code';
      ctx.fillText(node.ip, nx, ny + 32);
    });

    angle += 0.003;
    requestAnimationFrame(animateTopology);
  }

  animateTopology();
});

// Copy snippet helper
window.copySnippet = function(btn) {
  const code = btn.previousElementSibling.innerText;
  navigator.clipboard.writeText(code);
  btn.innerText = 'Copied! ✅';
  setTimeout(() => btn.innerText = 'Copy Code', 2000);
};
