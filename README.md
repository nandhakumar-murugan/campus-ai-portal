# 🧠 Campus AI Supercomputer & Developer Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-PyTorch-blue.svg)](https://python.org/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-orange.svg)](https://huggingface.co/)
[![Offline](https://img.shields.io/badge/Connectivity-100%25%20Offline-success.svg)]()

> A 100% offline, zero-cloud dependency, campus-wide AI mesh network and developer portal. Transforms student laptops and campus infrastructure into a decentralized AI supercomputer over the campus Wi-Fi intranet.

![Dashboard Screenshot Placeholder](https://via.placeholder.com/1200x600?text=Campus+AI+Supercomputer+Dashboard)

## ✨ Key Features

- **🌐 100% Offline & Zero Cloud**: Runs entirely on the campus Wi-Fi intranet (e.g., `172.16.x.x` subnet).
- **⚡ Real-Time Telemetry**: WebSocket-powered live monitoring of CPU, RAM, Wi-Fi speed, and signal strength across all nodes.
- **🗺️ Topology Visualization**: HTML5 Canvas-based live cluster topology map.
- **🔍 Subnet Discovery & Port Scanning**: Automatic ARP subnet scanning and TCP port scanning for 11 critical developer services.
- **📈 Live Resource Monitoring**: Real-time per-IP CPU and RAM heartbeat tracking via `/api/report-usage`.
- **💻 1-Click Compute Opt-In**: Students can easily join the compute pool via the browser.
- **🔄 P2P Failover**: Automatic routing to peer nodes with active LLMs if the primary neural server goes offline.
- **🔌 OpenAI Compatible API**: Drop-in replacement for OpenAI endpoints, perfect for VS Code Continue.dev and the Python SDK.
- **🎨 Glassmorphism UI**: Modern, dark glassmorphism interface with neon glow design.

## 🏗️ Architecture

The architecture consists of a Node.js central coordinator and a Python Neural Engine, operating in a peer-to-peer failover mesh.

```text
[ Campus Wi-Fi Mesh Network ]
         │
         ├─> [ Student Laptop 1 ] (Ollama, Jupyter)
         ├─> [ Student Laptop 2 ] (VS Code Continue.dev)
         │
[ Node.js Express Server (Port 3000) ] <== WebSocket / HTTP ==> [ Python Neural Engine (Port 11434) ]
   │ (Central Coordinator)                                        │ (Qwen2.5-0.5B-Instruct)
   │ - ARP Subnet Scanning (Every 3s)                             │ - HuggingFace Transformers
   │ - Port Scanning (11 Services)                                │ - PyTorch
   │ - OpenAI v1 Compatible API                                   │
   │ - P2P Failover Routing                                       │
```

## 🛠️ Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend** | Node.js, Express | Central HTTP API and WebSocket server |
| **Neural Engine** | Python, PyTorch | Hosts HuggingFace transformers models |
| **Real-Time Comm** | WebSockets (ws) | 3-second interval broadcasts for cluster metrics |
| **Frontend** | HTML5, CSS3, JS | Vanilla JS, Canvas API, Glassmorphism UI |
| **Network** | ARP, netsh, TCP | Subnet discovery and service scanning |

## 🚀 Quick Start

### Requirements
- **Node.js** v18+
- **Python** 3.10+
- Campus Wi-Fi Intranet connection

### Installation
1. Clone the repository and install Node dependencies:
   ```bash
   npm install
   ```
2. Install Python dependencies:
   ```bash
   pip install torch transformers
   ```

### Running
1. Start the Node.js server:
   ```bash
   node server.js
   ```
2. Start the Python Neural Engine:
   ```bash
   python llm_server.py
   ```
Access the portal at `http://localhost:3000`.

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cluster/metrics` | GET | Retrieve live cluster telemetry and stats |
| `/api/cluster/scan-device` | POST | Initiate a TCP port scan on a specific device |
| `/api/cluster/contributor/:ip` | GET | Get contributor details and scan results |
| `/api/cluster/join` | POST | Register a new device into the compute pool |
| `/api/report-usage` | POST | Live contributor CPU/RAM heartbeat endpoint |
| `/v1/models` | GET | OpenAI-compatible models list |
| `/v1/chat/completions` | POST | OpenAI-compatible chat completions endpoint |
| `/api/generate` | POST | Ollama-compatible generation endpoint |

*WebSocket Stream:* `ws://<host>:3000` emits `REALTIME_UPDATE` events.

## 📄 Web Pages

- **`index.html`**: AI Studio & Code Generator (chat interface, model selection, markdown rendering).
- **`cluster.html`**: Real-Time Cluster Monitor (metric cards, Hall of Fame, Canvas topology, ARP devices).
- **`join.html`**: Join Compute Pool (registration, port dashboard, hardware benchmark).
- **`setup.html`**: VS Code & Developer Setup instructions.
- **`docs.html`**: Developer Documentation (architecture, API reference).
- **`contributor-agent.html`**: Standalone tab for auto-reporting device stats in the background.

## 🤖 Supported AI Models

| Model | Type | Size |
|-------|------|------|
| gemma-2-2b | General | 2B |
| gemma-2-9b | General | 9B |
| gemini-nano | Mobile/Edge | Nano |
| deepseek-r1 | Reasoning | 32B |
| deepseek-coder | Coding | 16B |
| llama-3.2-3b | General | 3B |
| qwen-2.5-coder | Coding | 7B |

## 🔌 VS Code Integration

The server provides a 100% offline, OpenAI-compatible API on port 3000. You can configure the `Continue.dev` extension in VS Code to use the campus mesh:

```json
{
  "models": [
    {
      "title": "Campus AI",
      "provider": "openai",
      "model": "qwen-2.5-coder",
      "apiBase": "http://<server-ip>:3000/v1"
    }
  ]
}
```

## 🎓 How It Helps Students

Campus AI Supercomputer addresses key challenges faced by students on campus:

- **Free Access to AI**: Replaces paid subscriptions (like GitHub Copilot at ₹800/month or ChatGPT Plus).
- **100% Offline & Intranet Compatible**: Bypasses campus firewall restrictions and internet downtime.
- **Privacy Guarantee**: Code and prompts stay strictly within the campus Wi-Fi local network (`172.16.x.x`).
- **Distributed Resource Pooling**: Pools RAM/VRAM across multiple student laptops for higher performance.

---

## 🔄 Comparison with Other AI Tools

| Feature | GitHub Copilot | ChatGPT / Claude | Solo Ollama | Campus AI Supercomputer |
|:---|:---|:---|:---|:---|
| **Cost** | ₹800/month | ₹1600/month | Free | 🟢 **FREE** |
| **Connectivity** | Requires Internet | Requires Internet | Offline | 🟢 **100% Offline (Campus Wi-Fi)** |
| **Campus Firewall** | Often Blocked | Often Blocked | Works | 🟢 **Bypasses Firewall (Local IP)** |
| **Privacy & Security** | Cloud (Microsoft) | Cloud (OpenAI/Anthropic) | Local | 🟢 **100% Local (Zero Cloud Leaks)** |
| **Setup Required** | Subscription + Ext | Account + Subscription | Terminal & CLI | 🟢 **Zero Setup (Browser Access)** |
| **Compute Sharing** | Single Device | Cloud Servers | Single Device | 🟢 **Pooled Contributor RAM/VRAM** |
| **API Integration** | Proprietary | Paid API Keys | Localhost Only | 🟢 **OpenAI-Compatible API (`/v1`)** |

---

## 🛡️ Safety & Privacy Architecture

### Data Privacy Matrix
- **Chat Prompts & Code**: ❌ **NEVER stored** on disk or sent outside the network. Processed in memory and discarded.
- **Device Telemetry**: Only RAM capacity, CPU load, and IP addresses are shared for cluster load balancing.
- **Network Boundaries**: Operates strictly within local subnet bounds (`172.16.0.0/12`). External internet traffic is zero.

### Security Guarantees for Contributor Students
- **No Software Installation**: Students can contribute compute power directly via a web browser tab (`contributor-agent.html`).
- **Instant Opt-out**: Closing the contributor agent browser tab immediately stops telemetry and resource reporting.
- **Sandboxed Execution**: Host servers cannot execute arbitrary commands or access files on contributor student laptops.

---

## 📱 How Students Use It

1. **Browser AI Studio (`http://<server-ip>:3000`)**: Interactive chat interface for code generation, assignment help, and logic debugging.
2. **Free VS Code Copilot (`Continue.dev`)**: Configure the `Continue.dev` extension to use `http://<server-ip>:3000/v1` as an OpenAI provider.
3. **Python AI/ML Projects (`openai` SDK)**: Set `base_url="http://<server-ip>:3000/v1"` in Python scripts for free local LLM inference.
4. **Compute Contribution (`contributor-agent.html`)**: Open the contributor agent tab to share idle CPU/RAM resources with the campus cluster.

---

## 👨‍💻 Executive Author Profile & Bio

### **Nandhakumar M.**
*Head of KGiSL Campus Google Community • Google Student Ambassador*  
*B.E. Computer Science & Engineering (Cyber Security) — 3rd Year (V Semester)*  
**KGiSL Institute of Technology (KGiSL ITech), Coimbatore, Tamil Nadu, India**

---

### 🎯 Professional Profile & Objective
Passionate Computer Science and Cyber Security engineer specializing in **Artificial Intelligence, Generative AI, Cloud Infrastructure, and Digital Safety Systems**. As **Head of KGiSL Campus Google Community** and **Google Student Ambassador**, actively leading technical workshops, open-source initiatives, and on-campus developer ecosystems. Seeking opportunities to design scalable, secure, and high-performance AI solutions that solve real-world industry and educational challenges.

---

### 🌐 Core Technical Matrix

| Domain | Engineering Competencies & Tooling |
|:---|:---|
| **AI & Neural Systems** | Generative AI, Large Language Models (LLMs), On-Device Inference, Prompt Engineering |
| **Cybersecurity & Infra** | Digital Safety Architecture, Network Protocol Analysis, Intranet Mesh Networking, Virtualization |
| **Cloud & DevOps** | Google Cloud Platform (GCP), Firebase (Hosting & Realtime DB), Git, GitHub Actions |
| **Software Development** | Python, Java, C, Android SDK, Native Web Technologies (HTML5, CSS3, ES6+ JavaScript) |

---

### 🚀 Key Projects & Strategic Initiatives

- **⚡ Campus AI Supercomputer**: Founder & Architect of a zero-cloud, 100% offline distributed intranet AI mesh portal pooling RAM/VRAM across campus devices.
- **🧠 Prema AI Labs**: Lead Developer of an AI-powered bilingual (Tamil & English) educational assistant enhancing digital learning accessibility.
- **🛡️ SMNK Info Tech**: Cybersecurity initiative delivering AI-driven threat mitigation, digital safety guidelines, and secure software practices.
- **🛍️ DD Clothing**: Full-stack e-commerce web platform engineered and deployed on Google Firebase Cloud Infrastructure.

---

### 🏆 Industry Certifications & Community Leadership

- **Head of KGiSL Campus Google Community**: Leading developer events, AI hackathons, and Google ecosystem projects across campus.
- **Google Student Ambassador**: Recognized student leader advocating Google AI and cloud technologies.
- **Google Cloud Certified**: *Introduction to Generative AI* & *Google AI Safety Certification*.
- **Google Developer Network**: Active participant in Google Developer Group (GDG) summits and technical workshops.
- **GUVI Technical Certification**: Advanced Python Programming & Algorithmic Problem Solving.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.
