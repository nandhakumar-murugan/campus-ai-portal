# ⚡ Campus AI Supercomputer & Developer Portal

An open-source, high-performance **Campus AI Web Portal & Offline LLM Inference Engine** built for students and faculty at **KGiSL Educational Institutions** (`kgisledu.com`).

Developed by **Nandhakumar Murugan** ([github.com/nandhakumar-murugan](https://github.com/nandhakumar-murugan)).

---

## 🌟 Features

* 🔷 **Google DeepMind Offline AI**: Native support for **Google Gemma 2 (2B & 9B)** and **Google Gemini Nano** running 100% offline on local hardware with zero external cloud dependencies.
* ⚡ **Fault-Tolerant Distributed Campus Cluster**: Dynamically pools RAM/VRAM across active student laptops connected over campus Wi-Fi.
* 🛡️ **Automatic Peer-to-Peer Failover**: If the primary coordinator server turns off, connected student browsers automatically failover to secondary worker nodes with zero data loss.
* 💻 **Free VS Code Copilot Alternative**: Provides OpenAI-compatible `/v1/chat/completions` & `/v1/models` endpoints to power VS Code extensions (like Continue.dev) and Python scripts.
* 📶 **Real-Time Network & System Telemetry**: Live WebSocket streams for host CPU usage, RAM stats, active network IP addresses, and Wi-Fi link speeds (573.5 Mbps).
* 🤝 **1-Click Student Node Opt-In**: 1-click modal for students to register their laptop into the cluster compute pool.

---

## 🚀 Quick Start Guide

### 1. Requirements
* **Node.js**: v18.0.0 or higher
* **Python**: 3.10 or higher (with PyTorch and Transformers)
* **Campus Network**: Wi-Fi 6 (`172.16.0.0/12` or `192.168.x.x`)

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
The portal will launch on **port 3000** and bind to all network interfaces (`0.0.0.0:3000`).

---

## 👨‍💻 Author & Credits

* **Developer**: **Nandhakumar Murugan**
* **GitHub Repository**: [https://github.com/nandhakumar-murugan/campus-ai-portal](https://github.com/nandhakumar-murugan/campus-ai-portal)
* **Institution**: KGiSL Educational Institutions (`kgisledu.com`), Coimbatore, Tamil Nadu, India.

---

## 📄 License

Distributed under the **MIT License**. Free for academic and educational use across campus networks.
