const http = require('http');
const os = require('os');

class P2pMeshCluster {
  constructor() {
    this.nodes = new Map(); // ip -> { ip, port, ramGB, vramGB, status, latencyMs, lastSeen }
    this.localIp = this.getLocalIpAddress();
    this.scanInterval = null;
    this.registerSelfNode();
  }

  getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && !alias.internal && alias.address.startsWith('172.16.')) {
          return alias.address;
        }
      }
    }
    return '127.0.0.1';
  }

  registerSelfNode() {
    const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
    this.nodes.set(this.localIp, {
      ip: this.localIp,
      port: 3000,
      name: `Host (${os.hostname()})`,
      ramGB: totalMem,
      vramGB: 8, // Estimated local GPU VRAM
      status: 'ONLINE',
      latencyMs: 1,
      lastSeen: Date.now(),
      isSelf: true
    });
  }

  async scanSubnet(baseSubnet = '172.16.110') {
    const promises = [];
    const timeoutMs = 800;

    for (let i = 1; i <= 254; i++) {
      const targetIp = `${baseSubnet}.${i}`;
      if (targetIp === this.localIp) continue;

      promises.push(new Promise((resolve) => {
        const start = Date.now();
        const req = http.get(`http://${targetIp}:3000/api/health`, { timeout: timeoutMs }, (res) => {
          if (res.statusCode === 200) {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                const latency = Date.now() - start;
                this.nodes.set(targetIp, {
                  ip: targetIp,
                  port: 3000,
                  name: parsed.nodeName || `Peer (${targetIp})`,
                  ramGB: parsed.ramGB || 16,
                  vramGB: parsed.vramGB || 6,
                  status: 'ONLINE',
                  latencyMs: latency,
                  lastSeen: Date.now(),
                  isSelf: false
                });
              } catch (e) {
                this.nodes.set(targetIp, {
                  ip: targetIp,
                  port: 3000,
                  name: `Peer (${targetIp})`,
                  ramGB: 16,
                  vramGB: 6,
                  status: 'ONLINE',
                  latencyMs: Date.now() - start,
                  lastSeen: Date.now(),
                  isSelf: false
                });
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
      }));
    }

    await Promise.all(promises);
    this.cleanDeadNodes();
    return Array.from(this.nodes.values());
  }

  cleanDeadNodes() {
    const now = Date.now();
    for (const [ip, node] of this.nodes.entries()) {
      if (!node.isSelf && now - node.lastSeen > 30000) {
        this.nodes.delete(ip);
      }
    }
  }

  getClusterSummary() {
    const nodeList = Array.from(this.nodes.values());
    const totalRam = nodeList.reduce((sum, n) => sum + n.ramGB, 0);
    const totalVram = nodeList.reduce((sum, n) => sum + n.vramGB, 0);

    return {
      activeNodes: nodeList.length,
      totalRamGB: totalRam,
      totalVramGB: totalVram,
      nodes: nodeList
    };
  }

  startAutoDiscovery() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    this.scanSubnet();
    this.scanInterval = setInterval(() => this.scanSubnet(), 15000);
  }

  stopAutoDiscovery() {
    if (this.scanInterval) clearInterval(this.scanInterval);
  }
}

const meshCluster = new P2pMeshCluster();
module.exports = meshCluster;
