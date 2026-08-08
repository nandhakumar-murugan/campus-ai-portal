const vscode = require('vscode');
const http = require('http');
const { CampusAiChatViewProvider } = require('./src/webviewProvider');
const { CampusInlineCompletionItemProvider } = require('./src/inlineCompletionProvider');
const { queryAi } = require('./src/aiProviders');
const { CampusCodeLensProvider, CampusCodeActionProvider } = require('./src/codeLensProvider');

let statusBarItem;
let serverUrl = 'http://172.16.110.12:3000';
let isConnected = false;

// Virtual Document Provider for Diff Preview
const fixedDocumentProvider = new class {
  constructor() {
    this.documents = new Map();
    this.onDidChangeEmitter = new vscode.EventEmitter();
    this.onDidChange = this.onDidChangeEmitter.event;
  }

  provideTextDocumentContent(uri) {
    return this.documents.get(uri.toString()) || '';
  }

  set(uri, content) {
    this.documents.set(uri.toString(), content);
    this.onDidChangeEmitter.fire(uri);
  }
}();

function activate(context) {
  console.log('[+] Campus AI Copilot Activated (Antigravity 2.0 Engine)');

  // Register virtual document scheme for diff preview
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('campus-fixed', fixedDocumentProvider),
    vscode.commands.registerCommand('campusAi.setVirtualDoc', (uriString, content) => {
      fixedDocumentProvider.set(vscode.Uri.parse(uriString), content);
    })
  );

  // Register Inline CodeLens Provider
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ pattern: '**' }, new CampusCodeLensProvider())
  );

  // Register QuickFix CodeAction Provider for Error Squiggles
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider({ pattern: '**' }, new CampusCodeActionProvider())
  );

  // 1. Status Bar Item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'campusAi.reconnectServer';
  context.subscriptions.push(statusBarItem);
  statusBarItem.show();
  updateStatusBar('Scanning Network...', false);

  // 2. Health Auto-Discovery Loop
  checkServerHealth();
  const timer = setInterval(checkServerHealth, 5000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });

  // 3. Register Sidebar Webview Chat Provider
  const provider = new CampusAiChatViewProvider(context.extensionUri, () => serverUrl);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('campusAi.chatView', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // 4. Register GitHub Copilot-Style Inline Ghost Text Provider (Tab to Accept)
  const inlineProvider = new CampusInlineCompletionItemProvider(() => serverUrl);
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      inlineProvider
    )
  );

  // 5. Register Commands
  context.subscriptions.push(
    // CodeLens Lenses Actions
    vscode.commands.registerCommand('campusAi.refactorFunction', async (document, range) => {
      const codeSnippet = document.getText(range);
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "✨ Campus AI: Refactoring Function...",
        cancellable: false
      }, async () => {
        const prompt = `Refactor this ${document.languageId} function to be clean, modern, and high-performance:\n\n\`\`\`${document.languageId}\n${codeSnippet}\n\`\`\`\n\nReturn ONLY the refactored function code without explanations.`;
        const fixedCodeRaw = await queryAi(prompt, 'gemini-3.6-flash', serverUrl);
        const fixedCode = fixedCodeRaw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        if (fixedCode) {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, range, fixedCode);
          await vscode.workspace.applyEdit(edit);
          vscode.window.showInformationMessage('✨ Function Refactored Successfully!');
        }
      });
    }),

    vscode.commands.registerCommand('campusAi.generateTests', async (document, range) => {
      const codeSnippet = document.getText(range);
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🧪 Campus AI: Generating Unit Tests...",
        cancellable: false
      }, async () => {
        const prompt = `Write complete unit tests for this ${document.languageId} function:\n\n\`\`\`${document.languageId}\n${codeSnippet}\n\`\`\``;
        const testCode = await queryAi(prompt, 'gemini-3.6-flash', serverUrl);
        const doc = await vscode.workspace.openTextDocument({
          content: `# 🧪 Unit Tests (${document.languageId})\n\n${testCode}`,
          language: 'markdown'
        });
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      });
    }),

    vscode.commands.registerCommand('campusAi.explainFunction', async (document, range) => {
      const codeSnippet = document.getText(range);
      vscode.commands.executeCommand('campusAi.openChat');
      vscode.window.showInformationMessage('🧠 Explaining function in Campus AI Chat...');
    }),
    // ✨ Fix All Errors in Active File with Side-by-Side Diff Preview
    vscode.commands.registerCommand('campusAi.fixFileErrors', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Please open a file to fix errors.');
        return;
      }

      const document = editor.document;
      const diagnostics = vscode.languages.getDiagnostics(document.uri);

      if (diagnostics.length === 0) {
        vscode.window.showInformationMessage('🎉 No diagnostic errors found in active file!');
        return;
      }

      const errorMessages = diagnostics.map((d, i) =>
        `[Error ${i + 1}] Line ${d.range.start.line + 1}: ${d.message} (Severity: ${d.severity})`
      ).join('\n');

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `🔧 Campus AI: Fixing ${diagnostics.length} Errors...`,
        cancellable: false
      }, async () => {
        const fullCode = document.getText();
        const prompt = `Fix all syntax, type, and runtime errors in this ${document.languageId} file.\n\n` +
          `Diagnostic Errors:\n${errorMessages}\n\n` +
          `Original Code:\n\`\`\`${document.languageId}\n${fullCode}\n\`\`\`\n\n` +
          `Return ONLY the complete fixed code without markdown wrapping or explanations.`;

        const fixedCodeRaw = await queryAi(prompt, 'gemini-2.5-flash', serverUrl);
        const fixedCode = fixedCodeRaw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        if (!fixedCode) {
          vscode.window.showErrorMessage('Campus AI: Could not generate fix.');
          return;
        }

        // Create Virtual Document URI for Side-by-Side Diff Preview
        const fixedUri = vscode.Uri.parse(`campus-fixed://${document.uri.path}`);
        fixedDocumentProvider.set(fixedUri, fixedCode);

        // Open Side-by-Side Diff Window!
        await vscode.commands.executeCommand('vscode.diff', document.uri, fixedUri, `Original ↔ Fixed (${diagnostics.length} Errors Fixed)`);

        const choice = await vscode.window.showInformationMessage(
          `Review the diff preview! Apply ${diagnostics.length} fixed changes to your file?`,
          '✅ Apply Fixes',
          '❌ Discard'
        );

        if (choice === '✅ Apply Fixes') {
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(fullCode.length)
          );
          edit.replace(document.uri, fullRange, fixedCode);
          await vscode.workspace.applyEdit(edit);
          vscode.window.showInformationMessage('🎉 Fixed code applied successfully!');
        }
      });
    }),

    // GitHub Copilot Style Ctrl+I Inline Chat Generator
    vscode.commands.registerCommand('campusAi.inlineChat', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Please open a file to use Campus AI Inline Chat.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      const userPrompt = await vscode.window.showInputBox({
        prompt: "✨ Campus AI Copilot (Ctrl+I): Ask AI to generate, refactor, or fix code inline...",
        placeHolder: selectedText ? "e.g., Refactor this code to use async/await..." : "e.g., Write a function to calculate Fibonacci numbers..."
      });

      if (!userPrompt) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "✨ Campus AI: Generating Inline Code...",
        cancellable: false
      }, async () => {
        const fullPrompt = selectedText
          ? `Refactor/modify the following ${editor.document.languageId} code according to instruction: "${userPrompt}". Return ONLY code:\n\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``
          : `Generate ${editor.document.languageId} code according to instruction: "${userPrompt}". Return ONLY raw code without markdown wrapping.`;

        const response = await queryAi(fullPrompt, 'gemini-2.5-flash', serverUrl);
        const cleanCode = response.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

        if (cleanCode) {
          editor.edit(editBuilder => {
            if (!selection.isEmpty) {
              editBuilder.replace(selection, cleanCode);
            } else {
              editBuilder.insert(selection.active, cleanCode);
            }
          });
          vscode.window.showInformationMessage('✨ Code applied to editor!');
        }
      });
    }),

    vscode.commands.registerCommand('campusAi.openChat', () => {
      vscode.commands.executeCommand('workbench.view.extension.campus-ai-sidebar');
    }),
    vscode.commands.registerCommand('campusAi.reconnectServer', async () => {
      vscode.window.showInformationMessage('🔍 Scanning Campus Intranet Network for AI Server...');
      await checkServerHealth();
    }),
    vscode.commands.registerCommand('campusAi.insertCode', (code) => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.edit(builder => builder.insert(editor.selection.active, code));
      } else {
        vscode.window.showWarningMessage('Please open a file to insert code.');
      }
    }),
    vscode.commands.registerCommand('campusAi.securityAudit', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const text = editor.document.getText(editor.selection) || editor.document.getText();
      if (!text.trim()) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🛡️ Campus AI: Running Security Audit...",
        cancellable: false
      }, async () => {
        const prompt = `Audit this code for security vulnerabilities:\n\n\`\`\`\n${text}\n\`\`\``;
        const res = await queryAi(prompt, 'qwen-2.5-coder', serverUrl);
        const doc = await vscode.workspace.openTextDocument({
          content: `# 🛡️ Campus AI Security Audit\n\n${res}`,
          language: 'markdown'
        });
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      });
    }),
    vscode.commands.registerCommand('campusAi.explainTamil', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const text = editor.document.getText(editor.selection) || editor.document.getText();
      if (!text.trim()) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🧠 Campus AI: Explaining Code in Tamil & English...",
        cancellable: false
      }, async () => {
        const prompt = `Explain this code in clear TAMIL and ENGLISH:\n\n\`\`\`\n${text}\n\`\`\``;
        const res = await queryAi(prompt, 'gemma-2-2b', serverUrl);
        const doc = await vscode.workspace.openTextDocument({
          content: `# 🧠 Campus AI Explanation (தமிழ் & English)\n\n${res}`,
          language: 'markdown'
        });
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      });
    }),
    vscode.commands.registerCommand('campusAi.setGeminiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: "Enter your Google Gemini API Key (starts with AQ... or AIzaSy...)",
        password: true,
        ignoreFocusOut: true,
        value: ""
      });

      if (key && key.trim()) {
        const config = vscode.workspace.getConfiguration('campusAi');
        await config.update('provider', 'gemini', vscode.ConfigurationTarget.Global);
        await config.update('apiKey', key.trim(), vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('🔑 Gemini API Key Saved Successfully!');
        updateStatusBar('Gemini Active', true);
      }
    }),
    vscode.commands.registerCommand('campusAi.setApiKey', async () => {
      const selection = await vscode.window.showQuickPick([
        { label: '🟢 Campus AI Offline Mesh (Free)', value: 'campus-offline', description: '100% Free Local Intranet Pool' },
        { label: '🔑 Google Gemini (2.5 Flash / Pro)', value: 'gemini', description: 'Requires paid API key' },
        { label: '🔑 OpenAI (GPT-4o / GPT-4)', value: 'openai', description: 'Requires paid sk-... key' },
        { label: '🔑 Anthropic Claude (Sonnet / Opus)', value: 'claude', description: 'Requires paid sk-ant-... key' }
      ], { placeHolder: 'Select AI Provider' });

      if (!selection) return;
      const config = vscode.workspace.getConfiguration('campusAi');
      await config.update('provider', selection.value, vscode.ConfigurationTarget.Global);

      if (selection.value === 'campus-offline') {
        await config.update('apiKey', '', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('🟢 Switched to Free Campus AI Offline Mesh!');
        updateStatusBar('Connected', true);
        return;
      }

      const key = await vscode.window.showInputBox({
        prompt: `Enter API Key for ${selection.label}`,
        password: true,
        ignoreFocusOut: true
      });

      if (key && key.trim()) {
        await config.update('apiKey', key.trim(), vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`🔑 Saved ${selection.label} API Key!`);
        updateStatusBar(`Key Set (${selection.value.toUpperCase()})`, true);
      }
    })
  );
}

function updateStatusBar(text, active) {
  const config = vscode.workspace.getConfiguration('campusAi');
  const provider = config.get('provider') || 'campus-offline';

  if (provider !== 'campus-offline') {
    statusBarItem.text = `$(key) ⚡ Campus AI: Key (${provider.toUpperCase()})`;
    statusBarItem.tooltip = 'Using Custom API Key';
    return;
  }

  if (active) {
    statusBarItem.text = `$(zap) ⚡ Campus AI: Connected (${serverUrl.replace('http://', '')})`;
    statusBarItem.tooltip = 'Click to scan/reconnect';
  } else {
    statusBarItem.text = `$(warning) ⚡ Campus AI: Offline (${text})`;
    statusBarItem.tooltip = 'Click to retry connection';
  }
}

async function checkServerHealth() {
  const urls = ['http://172.16.110.12:3000', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  for (const url of urls) {
    try {
      const res = await fetchJson(`${url}/api/cluster/metrics`);
      if (res && res.hostIP) {
        serverUrl = url;
        isConnected = true;
        updateStatusBar(`Host: ${res.hostIP}`, true);
        return;
      }
    } catch (e) {}
  }
  isConnected = false;
  updateStatusBar('Disconnected', false);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
