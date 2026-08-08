# ⚡ Campus AI Supercomputer Copilot

> **100% Zero-Cloud AI Coding Assistant & Security Auditor for KGiSL Campus Intranet Network**  
> *Developed by Nandhakumar M. • Head of KGiSL Campus Google Community & Google Student Ambassador*

---

## 🚀 Key Features (GitHub Copilot Parity)

### 1. ⌨️ Inline Ghost Text Code Completion (`Tab` to Accept)

- As you type inside any `.py`, `.js`, `.java`, `.cpp`, or `.html` file, grey ghost text suggestions appear automatically.
- Press **`Tab`** to instantly accept and apply the code completion!

### 2. ✨ `Ctrl + I` Inline AI Code Generator & Refactor

- Press **`Ctrl + I`** anywhere in your editor to open a quick floating AI prompt bar.
- Type prompts like *"Write a Python script for network scanning"* or *"Refactor to async/await"*.
- Replaces selected text or inserts generated code directly at your cursor!

### 3. 💬 ChatGPT & Gemini-Style Sidebar Chat Studio

- High-speed character-by-character typewriter streaming response rendering.
- Threaded conversation UI with User questions and Campus AI answers.
- **Multi-Turn Context Memory**: Remembers past context across your conversation.
- Interactive action icons: 🔊 Read Aloud (Web Speech API), 📋 Copy Code, 📥 1-Click Code Inserter.

### 4. 🔑 Google Gemini 2.5 Flash Integration with Automatic Offline Fallback

- Direct API integration with **Google Gemini 2.5 Flash**.
- **Automatic Fallback**: If internet or quota fails (429), automatically routes requests through the **Campus AI Local Intranet Mesh (`Qwen 2.5 Coder`)** on `http://172.16.110.12:3000`.

### 5. 🛡️ OWASP Cybersecurity Auditor & Tamil Explanation

- **Right-Click -> Campus AI: Run Security Audit**: Audits code for SQL injection, hardcoded credentials, and buffer overflows.
- **Right-Click -> Campus AI: Explain Code in Tamil & English**: Gives bilingual line-by-line explanations for students.

### 6. 🧰 Fix Current Error (Copilot-Style with Diff Preview)

- **Right-Click -> Campus AI: Fix Current Error (with Preview)**
- Reads the nearest VS Code diagnostic (error/warning) in the active file.
- Sends diagnostic + nearby code context to Campus AI.
- Lets you choose:

  - **Preview diff** first, then approve apply.
  - **Apply directly** to replace only the diagnostic code span.

---

## ⌨️ Shortcut Summary

- `Ctrl + I` (or `Cmd + I`): Launch Floating Inline Code Generator / Refactor Box
- `Tab`: Accept Inline Ghost Text Code Completion
- `Enter` (in Chat): Submit Prompt to Campus AI Studio
- `Shift + Enter`: Add Newline in Chat Box
- `Ctrl + Shift + P`: Command Palette -> `Campus AI: Open Chat Studio`
- Right Click: `Campus AI: Fix Current Error (with Preview)`

---

## 🏗️ Clean Modular Architecture

```text
vscode-extension/
├── src/
│   ├── aiProviders.js             <-- Multi-provider API client (Gemini 2.5 Flash, Local Mesh, OpenAI, Claude)
│   ├── inlineCompletionProvider.js <-- Ghost text completion engine (Tab to accept)
│   ├── webviewProvider.js         <-- VS Code Webview View Provider bridge
│   └── chatView.html              <-- Isolated HTML/CSS/JS interface (Zero escaping bugs!)
├── extension.js                   <-- Extension entry point & command registry
├── package.json                   <-- Keybindings (Ctrl+I), menus, and extension metadata
└── README.md                      <-- Documentation manual
```

---

## 🎓 Author & Credits

- **Author**: Nandhakumar M. (B.E. CSE Cybersecurity, 3rd Year / V Semester)
- **Institution**: KGiSL Institute of Technology (KGiSL ITech), Coimbatore, Tamil Nadu
- **Roles**: Head of KGiSL Campus Google Community & Google Student Ambassador
- **API Engine**: Powered by Google AI Studio (Gemini 2.5 Flash) & KGiSL Campus Intranet Supercomputer Cluster.
