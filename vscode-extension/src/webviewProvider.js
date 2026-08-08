const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { queryAi, deepResearch, cancelCurrentRequest, getStats, setBudgetMode } = require('./aiProviders');

const { runAutonomousGoal } = require('./goalRunner');
const { getSkillPrompt } = require('./skillsManager');
const { executeTool } = require('./toolBridge');

const meshCluster = require('./meshCluster');

class CampusAiChatViewProvider {
  constructor(extensionUri, getServerUrl) {
    this._extensionUri = extensionUri;
    this._getServerUrl = getServerUrl;
    this._abortController = null;
    meshCluster.startAutoDiscovery();
  }

  resolveWebviewView(webviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [this._extensionUri]
    };

    // Broadcast Mesh Cluster summary telemetry every 10s
    setInterval(() => {
      webviewView.webview.postMessage({
        command: 'meshStats',
        ...meshCluster.getClusterSummary()
      });
    }, 10000);

    const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'chatView.html');
    webviewView.webview.html = fs.readFileSync(htmlPath, 'utf8');

    webviewView.webview.onDidReceiveMessage(async (message) => {
      try {
        if (message.command === 'query') {
          this._abortController = new AbortController();
          const serverUrl = this._getServerUrl();

          // Collect Workspace Context & Agent Skills
          let fullPrompt = message.prompt;
          const workspaceFolders = vscode.workspace.workspaceFolders;
          const activeEditor = vscode.window.activeTextEditor;

          // Check if custom skill is activated
          const skillMatch = message.prompt.match(/\[ACTIVATE AGENT SKILL:\s*([a-zA-Z0-9_\-]+)\]/);
          if (skillMatch) {
            const skillName = skillMatch[1];
            const skillPrompt = getSkillPrompt(skillName);
            if (skillPrompt) {
              fullPrompt = `[SYSTEM AGENT SKILL: ${skillName}]\n${skillPrompt}\n\n${fullPrompt}`;
            }
          }

          // AUTONOMOUS TOOL INTENT INTERCEPTOR
          const lowerPrompt = message.prompt.trim();
          if (/^(run command|exec|cmd|run)\s+(.+)/i.test(lowerPrompt)) {
            const match = lowerPrompt.match(/^(run command|exec|cmd|run)\s+(.+)/i);
            const cmdToRun = match[2].trim();
            const toolResult = await executeTool("run_command", { command: cmdToRun });
            webviewView.webview.postMessage({ command: 'response', id: message.id, text: `💻 **Terminal Output (\`${cmdToRun}\`)**:\n\n\`\`\`text\n${toolResult}\n\`\`\`` });
            webviewView.webview.postMessage({ command: 'stats', ...getStats() });
            return;
          }

          if (/^(view file|cat|read file)\s+(.+)/i.test(lowerPrompt)) {
            const match = lowerPrompt.match(/^(view file|cat|read file)\s+(.+)/i);
            const filePath = match[2].trim();
            const toolResult = await executeTool("view_file", { filePath: filePath });
            webviewView.webview.postMessage({ command: 'response', id: message.id, text: `📄 **File Content (\`${filePath}\`)**:\n\n${toolResult}` });
            webviewView.webview.postMessage({ command: 'stats', ...getStats() });
            return;
          }

          if (/^(grep search|find|grep)\s+(.+)/i.test(lowerPrompt)) {
            const match = lowerPrompt.match(/^(grep search|find|grep)\s+(.+)/i);
            const query = match[2].trim();
            const toolResult = await executeTool("grep_search", { query: query });
            webviewView.webview.postMessage({ command: 'response', id: message.id, text: `🔍 **Grep Search Results (\`${query}\`)**:\n\n${toolResult}` });
            webviewView.webview.postMessage({ command: 'stats', ...getStats() });
            return;
          }

          let wsContext = '';
          if (workspaceFolders && workspaceFolders.length > 0) {
            const rootPath = workspaceFolders[0].uri.fsPath;
            const rootName = workspaceFolders[0].name;

            // Find top files in workspace
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 25);
            const fileList = files.map(f => path.relative(rootPath, f.fsPath)).join(', ');

            wsContext += `[WORKSPACE CONTEXT]\nProject Name: ${rootName}\nRoot Path: ${rootPath}\nWorkspace Files: ${fileList}\n`;

            // Check if package.json exists
            const pkgPath = path.join(rootPath, 'package.json');
            if (fs.existsSync(pkgPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                wsContext += `Project Package Details: name="${pkg.name || ''}", version="${pkg.version || ''}", description="${pkg.description || ''}"\n`;
              } catch (e) {}
            }
          }

          if (activeEditor) {
            const activeFile = path.basename(activeEditor.document.uri.fsPath);
            const activeText = activeEditor.document.getText(activeEditor.selection) || activeEditor.document.getText().substring(0, 1000);
            wsContext += `Active Editor File: ${activeFile} (${activeEditor.document.languageId})\nContent Snippet:\n\`\`\`${activeEditor.document.languageId}\n${activeText}\n\`\`\`\n`;
          }

          if (wsContext) {
            fullPrompt = `${wsContext}\n[USER QUESTION]\n${message.prompt}`;
          }

          try {
            let answer;
            if (message.command === 'runGoal' || message.prompt.startsWith('/goal')) {
              const cleanGoal = message.prompt.replace(/^\/goal\s*/, '').trim() || 'Create a full stack web application';
              answer = await runAutonomousGoal(cleanGoal, message.model, serverUrl, webviewView.webview, this._abortController.signal);
            } else if (message.command === 'deepResearch' || message.prompt.startsWith('/research')) {
              const cleanTopic = message.prompt.replace(/^\/research\s*/, '').trim() || 'Project Architecture & Optimizations';
              answer = await deepResearch(cleanTopic, message.model, serverUrl, this._abortController.signal);
            } else {
              answer = await queryAi(fullPrompt, message.model, serverUrl, this._abortController.signal);
            }
            
            webviewView.webview.postMessage({ command: 'response', id: message.id, text: answer });
            webviewView.webview.postMessage({ command: 'stats', ...getStats() });
          } catch (err) {
            webviewView.webview.postMessage({ command: 'response', id: message.id, text: `⚠️ **Campus AI Error:** ${err.message || 'Unable to connect to AI server.'}\n\nPlease check your network connection or API Key setting.` });
          }
        } else if (message.command === 'cancelQuery') {
          if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
          }
          cancelCurrentRequest();
        } else if (message.command === 'setBudget') {
          setBudgetMode(message.enabled);
          if (message.enabled) {
            vscode.window.showInformationMessage('🛡️ Hard Budget Mode Enabled ($0.00 Strict Free Tier / Local Mesh Only)');
          }
        } else if (message.command === 'executeTool') {
          const toolResult = await executeTool(message.toolName, message.toolArgs);
          webviewView.webview.postMessage({ command: 'response', id: message.id, text: `🛠️ **Tool Result (${message.toolName})**:\n\n${toolResult}` });
          webviewView.webview.postMessage({ command: 'stats', ...getStats() });
        } else if (message.command === 'applyDiffToFile') {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a workspace folder first.');
            return;
          }
          const rootPath = workspaceFolders[0].uri.fsPath;
          let targetPath = message.filePath ? (path.isAbsolute(message.filePath) ? message.filePath : path.join(rootPath, message.filePath)) : null;

          // Default target file if unspecified: active editor file or README.md
          const activeEditor = vscode.window.activeTextEditor;
          if (!targetPath && activeEditor) {
            targetPath = activeEditor.document.uri.fsPath;
          }
          if (!targetPath) {
            targetPath = path.join(rootPath, 'README.md');
          }

          // ZERO-PROMPT DIRECT AGENT WRITE!
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, message.content, 'utf8');

          const doc = await vscode.workspace.openTextDocument(targetPath);
          await vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage(`⚡ Agent Applied Edits Directly to ${path.basename(targetPath)}!`);
        } else if (message.command === 'createFile') {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a workspace folder first.');
            return;
          }
          const rootPath = workspaceFolders[0].uri.fsPath;
          const fileName = message.filePath || 'generated_file.txt';
          const targetPath = path.isAbsolute(fileName) ? fileName : path.join(rootPath, fileName);

          // ZERO-PROMPT DIRECT AGENT FILE CREATION!
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.writeFileSync(targetPath, message.content, 'utf8');

          const doc = await vscode.workspace.openTextDocument(targetPath);
          await vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage(`✨ Agent Created File: ${path.basename(targetPath)}`);
        } else if (message.command === 'updateFile') {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('Please open a workspace folder first.');
            return;
          }
          const rootPath = workspaceFolders[0].uri.fsPath;
          const targetPath = path.isAbsolute(message.filePath) ? message.filePath : path.join(rootPath, message.filePath);

          fs.writeFileSync(targetPath, message.content, 'utf8');
          const doc = await vscode.workspace.openTextDocument(targetPath);
          await vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage(`📝 File Updated: ${path.basename(targetPath)}`);
        } else if (message.command === 'insertCode') {
          vscode.commands.executeCommand('campusAi.insertCode', message.code);
        } else if (message.command === 'setKey') {
          vscode.commands.executeCommand('campusAi.setApiKey');
        } else if (message.command === 'setGeminiKey') {
          vscode.commands.executeCommand('campusAi.setGeminiKey');
        } else if (message.command === 'scan') {
          vscode.commands.executeCommand('campusAi.reconnectServer');
        }
      } catch (err) {
        vscode.window.showErrorMessage('Campus AI Error: ' + err.message);
      }
    });
  }
}

module.exports = { CampusAiChatViewProvider };
