const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { performLiveWebSearch } = require('./webSearch');

// Antigravity Native Tool Declarations
const TOOLS = [
  {
    name: "run_command",
    description: "Run a terminal command inside the workspace (e.g. npm test, python script.py, git status)",
    parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] }
  },
  {
    name: "view_file",
    description: "View contents of a file from workspace",
    parameters: { type: "object", properties: { filePath: { type: "string" } }, required: ["filePath"] }
  },
  {
    name: "write_to_file",
    description: "Write code content directly to a file in workspace",
    parameters: { type: "object", properties: { filePath: { type: "string" }, content: { type: "string" } }, required: ["filePath", "content"] }
  },
  {
    name: "list_dir",
    description: "List directory contents of a folder in workspace",
    parameters: { type: "object", properties: { dirPath: { type: "string" } } }
  },
  {
    name: "grep_search",
    description: "Search for exact text pattern across workspace files",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
  },
  {
    name: "search_web",
    description: "Search live internet web for documentation, solutions, and citations",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
  }
];

function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return (folders && folders.length > 0) ? folders[0].uri.fsPath : process.cwd();
}

async function executeTool(name, args) {
  const rootPath = getWorkspaceRoot();

  try {
    if (name === "run_command") {
      return new Promise((resolve) => {
        exec(args.command, { cwd: rootPath, timeout: 15000 }, (err, stdout, stderr) => {
          if (err) {
            resolve(`Command Failed (${err.message}):\n${stderr || stdout}`);
          } else {
            resolve(`Command Execution Output:\n${stdout || 'Command completed successfully.'}`);
          }
        });
      });
    }

    if (name === "view_file") {
      const targetPath = path.isAbsolute(args.filePath) ? args.filePath : path.join(rootPath, args.filePath);
      if (!fs.existsSync(targetPath)) return `Error: File ${args.filePath} does not exist.`;
      const text = fs.readFileSync(targetPath, 'utf8');
      return `File Content (${args.filePath}):\n\`\`\`\n${text.substring(0, 3000)}\n\`\`\``;
    }

    if (name === "write_to_file") {
      const targetPath = path.isAbsolute(args.filePath) ? args.filePath : path.join(rootPath, args.filePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, args.content, 'utf8');

      const doc = await vscode.workspace.openTextDocument(targetPath);
      await vscode.window.showTextDocument(doc);
      return `Success: Wrote file ${args.filePath}`;
    }

    if (name === "list_dir") {
      const targetPath = args.dirPath ? (path.isAbsolute(args.dirPath) ? args.dirPath : path.join(rootPath, args.dirPath)) : rootPath;
      if (!fs.existsSync(targetPath)) return `Error: Directory ${args.dirPath} does not exist.`;
      const files = fs.readdirSync(targetPath);
      return `Directory Listing (${path.basename(targetPath)}):\n${files.join('\n')}`;
    }

    if (name === "grep_search") {
      const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 50);
      let results = [];
      for (const f of files) {
        try {
          const content = fs.readFileSync(f.fsPath, 'utf8');
          if (content.includes(args.query)) {
            results.push(path.relative(rootPath, f.fsPath));
          }
        } catch (e) {}
      }
      return `Grep Matches for "${args.query}":\n${results.length > 0 ? results.join('\n') : 'No matches found.'}`;
    }

    if (name === "search_web") {
      return await performLiveWebSearch(args.query);
    }

    return `Unknown tool: ${name}`;
  } catch (e) {
    return `Tool Execution Error: ${e.message}`;
  }
}

module.exports = { TOOLS, executeTool };
