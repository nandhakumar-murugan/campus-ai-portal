// ==========================================================================
// CAMPUS AI PORTAL - SHARED COMMON MODULE
// Used across all pages for WebSocket, state, auto-connect, and utilities
// ==========================================================================

const AppState = {
  hostIP: window.location.hostname || '172.16.49.168',
  nodes: [],
  registeredContributors: [],
  totals: { activeCount: 0, totalVRAM: 0, totalRAM: 0 },
  sys: {
    cpuUsagePercent: 0, ramUsagePercent: 0, totalRAMGB: 0, freeRAMGB: 0,
    usedRAMGB: 0, cpuCores: 0, cpuModel: '',
    wifi: { ssid: 'Campus Wi-Fi', speedMbps: '--', rxMbps: '--', txMbps: '--', signalPercent: '--%', radioType: 'Wi-Fi 6', band: '', channel: '' }
  },
  totalRequests: 0,
  selectedModel: 'gemma-2-2b',
  autoConnected: false,
  autoConnectIP: '',
  autoConnectName: ''
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateHeaderUI() {
  if (AppState.sys.wifi) {
    const wifiNameElem = document.getElementById('wifi-name');
    if (wifiNameElem) wifiNameElem.innerText = AppState.sys.wifi.ssid || 'Campus Wi-Fi';

    const wifiSpeedElem = document.getElementById('wifi-speed');
    if (wifiSpeedElem) {
      const rx = AppState.sys.wifi.rxMbps || AppState.sys.wifi.speedMbps || '--';
      const tx = AppState.sys.wifi.txMbps || '--';
      const band = AppState.sys.wifi.band || '';
      const ch = AppState.sys.wifi.channel || '';
      wifiSpeedElem.innerText = `\u2193${rx} / \u2191${tx} Mbps ${band ? '\u2022 ' + band : ''}${ch ? ' CH' + ch : ''}`;
    }

    const wifiSignalElem = document.getElementById('wifi-signal');
    if (wifiSignalElem) {
      const sig = AppState.sys.wifi.signalPercent || '--%';
      const sigNum = parseInt(sig) || 0;
      let bars = '\ud83d\udcf6';
      if (sigNum < 40) bars = '\ud83d\udce1';
      wifiSignalElem.innerText = `${bars} ${sig}`;
      wifiSignalElem.style.color = sigNum >= 70 ? '#22C55E' : sigNum >= 40 ? '#F59E0B' : '#EF4444';
    }
  }

  const hostIpElem = document.getElementById('host-ip');
  if (hostIpElem) hostIpElem.innerText = AppState.hostIP;

  const activeNodesElem = document.getElementById('active-nodes-count');
  if (activeNodesElem) activeNodesElem.innerText = `${AppState.totals.activeCount} Real Devices`;
}

// WebSocket Connection
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}`;
let socket;
try {
  socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'REALTIME_UPDATE') {
      AppState.hostIP = data.hostIP || window.location.hostname;
      AppState.nodes = data.nodes || [];
      AppState.registeredContributors = data.registeredContributors || [];
      AppState.totals = data.totals || { activeCount: 0, totalVRAM: 0, totalRAM: 0 };
      AppState.sys = data.sys || {};
      AppState.totalRequests = data.totalRequestsProcessed || 0;
      updateHeaderUI();
      // Fire custom event so page-specific JS can react
      window.dispatchEvent(new CustomEvent('clusterUpdate', { detail: data }));
    }
  };
} catch(e) { console.log('WebSocket unavailable'); }

// Auto-Connect
async function autoConnectVisitingDevice() {
  if (AppState.autoConnected) return;
  const detectedRam = navigator.deviceMemory || 16;
  const detectedCores = navigator.hardwareConcurrency || 8;
  const userAgent = navigator.userAgent;
  let deviceName = 'Student Device';
  if (userAgent.includes('Macintosh')) deviceName = 'MacBook Node';
  else if (userAgent.includes('Windows')) deviceName = 'Windows Laptop Node';
  else if (userAgent.includes('Android')) deviceName = 'Android Mobile Node';
  else if (userAgent.includes('iPhone')) deviceName = 'iPhone Mobile Node';

  try {
    const res = await fetch('/api/cluster/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${deviceName} (${detectedCores} Cores)`, type: `${deviceName} (${detectedCores} CPU / ${detectedRam}GB RAM)`, ramGB: detectedRam, vramGB: 4, userAgent })
    });
    const data = await res.json();
    if (data.success) {
      AppState.autoConnected = true;
      AppState.autoConnectIP = data.node.ip;
      AppState.autoConnectName = `${deviceName} (${detectedCores} Cores)`;
      const banner = document.getElementById('auto-connect-banner');
      if (banner) {
        banner.innerHTML = `\ud83d\udfe2 <strong>Device Auto-Connected & Contributing!</strong> Your IP (<code>${data.node.ip}</code>) is live in the cluster with ${detectedRam}GB RAM. <a href="join.html" class="btn-view-dashboard">\ud83d\udcca View My Dashboard</a>`;
        banner.classList.remove('hidden');
      }
      // Auto-trigger scan if on join page
      if (typeof scanContributorDevice === 'function') {
        scanContributorDevice(AppState.autoConnectName, data.node.ip);
      }
    }
  } catch (err) { console.log('Auto-connect done'); }
}
setTimeout(autoConnectVisitingDevice, 1000);

// Highlight active nav link
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

// Utilities
window.copySnippet = function(btn) {
  const code = btn.previousElementSibling.innerText;
  navigator.clipboard.writeText(code);
  btn.innerText = 'Copied! \u2705';
  setTimeout(() => btn.innerText = 'Copy Code', 2000);
};

window.copyCmd = function(el, cmd) {
  navigator.clipboard.writeText(cmd);
  el.querySelector('.copy-icon').textContent = '\u2705';
  setTimeout(() => el.querySelector('.copy-icon').textContent = '\ud83d\udccb', 2000);
};
