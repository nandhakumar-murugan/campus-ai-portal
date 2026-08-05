# ⚡ Campus AI Supercomputer & Developer Portal

An open-source, high-performance **Campus AI Web Portal & Distributed Cluster Coordinator** built for student devices on the college intranet (`kgisledu.com` / `NMH-HOSTEL` Wi-Fi).

This platform pools RAM/VRAM across student laptops and campus lab PCs over high-speed Wi-Fi 6, enabling any student on campus to generate code, chat with top AI models (DeepSeek R1, Llama 3.2, Qwen 2.5 Coder), and integrate AI directly into **VS Code** (`Continue.dev`, `Cline`) for free.

---

## 👤 Author & Project Creator

* **Creator & Lead Developer**: **Nandhakumar Murugan**
* **GitHub Profile**: [github.com/nandhakumar-murugan](https://github.com/nandhakumar-murugan)
* **Repository**: [nandhakumar-murugan/campus-ai-portal](https://github.com/nandhakumar-murugan/campus-ai-portal)
* **Institution**: KGiSL Educational Institutions (`kgisledu.com`), Coimbatore, Tamil Nadu, India
* **Campus Network**: `NMH-HOSTEL` Wi-Fi 6 (`172.16.0.0/12`)

---

## 🌟 Key Features

1. **💬 Interactive AI Chat & Code Generator**:
   - Web UI for code generation with syntax highlighting, 1-click code copying, model switching, and custom system prompts.
2. **⚡ Live Campus Cluster Dashboard**:
   - Real-time topology map of active student nodes (`172.16.x.x`).
   - Gauges for Pooled RAM/VRAM capacity, request latency, active queue, and Wi-Fi 6 bandwidth (`573.5 Mbps`).
3. **🤝 Student Node Opt-In Interface**:
   - 1-click modal for students to register their laptop into the hostel compute pool.
4. **💻 VS Code & Developer Integration**:
   - Auto-generates ready-to-copy configurations for `Continue.dev`, `Roo Code`, `Cline`, Python SDK, and cURL commands.
5. **🔌 OpenAI & Ollama Compatible Endpoints**:
   - Serves `/v1/chat/completions` and `/api/generate` locally on port `3000` / `11434`.

---

## 💻 Hardware & Network Infrastructure

* **Host Coordinator Node**: `NANDHAKUMAR` (`172.16.110.229` / `192.168.137.1`)
* **Host Processor**: 12th Gen Intel(R) Core(TM) i5-1235U (12 Cores)
* **System Memory**: 16 GB RAM
* **Network Speed**: 573.5 Mbps (Wi-Fi 6 802.11ax, 5 GHz)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- Connected to Campus Wi-Fi (`NMH-HOSTEL` or `kgisledu.com`)

### 1. Install & Run Server
```bash
git clone https://github.com/nandhakumar-murugan/campus-ai-portal.git
cd campus-ai-portal
npm install
npm start
```

### 2. Access the Portal on Campus
Open your browser on any device (Laptop, Phone, Tablet) connected to campus Wi-Fi:
```http
http://172.16.110.229:3000
```
*(Or replacement local IP address of your host machine)*

---

## 🛠️ VS Code Integration (GitHub Copilot Alternative)

1. Install the **[Continue.dev](https://continue.dev)** extension in VS Code.
2. Open `~/.continue/config.json` and paste the generated config snippet from the portal:

```json
{
  "models": [
    {
      "title": "Campus AI (DeepSeek / Llama)",
      "provider": "ollama",
      "model": "deepseek-coder",
      "apiBase": "http://172.16.110.229:3000"
    }
  ]
}
```

---

## 🛡️ Architecture & Security
- **100% Local**: No student prompts or code ever leave the `172.16.x.x` intranet.
- **Zero Internet Data Used**: Inference occurs strictly inside the local Wi-Fi LAN.
- **Fault-Tolerant**: Dynamic auto-failover if student laptops join or disconnect.

---
*Created by **Nandhakumar Murugan** for KGiSL Educational Institutions (`kgisledu.com`) Hostel & Campus Community.*
