# ⚡ Campus AI Supercomputer & Developer Portal

An open-source, high-performance **Campus AI Web Portal & Offline LLM Inference Grid** built for students and faculty at **KGiSL Educational Institutions** (`kgisledu.com`).

Developed by **Nandhakumar Murugan** ([github.com/nandhakumar-murugan](https://github.com/nandhakumar-murugan)).

---

## 🌟 Key Features

* 🔷 **Google DeepMind Offline AI**: Native support for **Google Gemma 2 (2B & 9B)** and **Google Gemini Nano** running 100% offline on local hardware with zero external cloud dependencies.
* ⚡ **Fault-Tolerant Distributed Campus Cluster**: Dynamically pools RAM/VRAM across active student laptops connected over campus Wi-Fi.
* 🔍 **Automated Contributor Device Port Scanner**: Auto-scans registered contributor nodes for active AI/ML services (Ollama, Jupyter, Gradio, Streamlit, Flask, FastAPI, SMB, RDP, SSH) and generates customized 1-click installation guides.
* 📄 **Multi-Page Architecture**:
  * 💬 **AI Studio (`index.html`)**: Real-time code generator & assistant.
  * ⚡ **Cluster Monitor (`cluster.html`)**: Interactive topology map & subnet ARP device discovery.
  * 🤝 **Join Compute Pool (`join.html`)**: Contributor registration & System Capabilities Scanner.
  * 💻 **VS Code & Dev Setup (`setup.html`)**: Auto-generated integration snippets for Continue.dev, Python OpenAI SDK, and cURL.
* 🛡️ **Automatic Peer-to-Peer Failover**: If the primary coordinator server turns off, connected student browsers automatically failover to secondary worker nodes with zero data loss.
* 📶 **Real-Time Network Telemetry**: Live WebSocket streams for host CPU usage, RAM stats, active network IP addresses, Wi-Fi link speed (RX/TX Mbps), band (5 GHz), and signal strength (📶 %).

---

## 💻 Hardware Compatibility & Model Guide

Whether your laptop has a dedicated gaming GPU or an integrated CPU, the Campus AI Portal automatically optimizes execution:

| System Spec | Hardware Type | Recommended Offline AI Models | Expected Speed |
| :--- | :--- | :--- | :--- |
| **High Spec** | Dedicated NVIDIA RTX / Apple Silicon (M1-M4) | `deepseek-r1:32b`, `deepseek-coder:16b`, `gemma2:9b` | ⚡ Fast VRAM Speed |
| **Standard Spec** | 10-Core Intel i5 / AMD Ryzen (16 GB RAM) | `gemma2:2b`, `llama3.2:3b`, `qwen2.5-coder:1.5b` | 🚀 Smooth CPU/RAM Speed |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python** *(Optional for local LLM)*: 3.10+ (PyTorch & HuggingFace Transformers)
* **Ollama** *(Optional for GPU acceleration)*: `winget install Ollama.Ollama`

### 2. Installation
```bash
git clone https://github.com/nandhakumar-murugan/campus-ai-portal.git
cd campus-ai-portal
npm install
```

### 3. Running the Campus Server
```bash
npm start
```
The portal will launch on **port 3000** and automatically bind to all campus network interfaces (`0.0.0.0:3000`).

---

## 🌐 Portal Endpoints & API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/v1/chat/completions` | `POST` | OpenAI-compatible chat API endpoint |
| `/v1/models` | `GET` | List available offline AI models |
| `/api/cluster/metrics` | `GET` | Cluster metrics & system stats |
| `/api/cluster/join` | `POST` | Register a new contributor laptop node |
| `/api/cluster/scan-device` | `POST` | Perform port scan & capability diagnostic on a node IP |

---

## 👨‍💻 Author & Credits

* **Developer**: **Nandhakumar Murugan**
* **GitHub Repository**: [github.com/nandhakumar-murugan/campus-ai-portal](https://github.com/nandhakumar-murugan/campus-ai-portal)
* **Institution**: KGiSL Educational Institutions (`kgisledu.com`), Coimbatore, Tamil Nadu, India.

---

## 📄 License

Distributed under the **MIT License**. Free for academic and educational use across campus networks.
