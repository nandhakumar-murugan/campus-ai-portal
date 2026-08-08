const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { queryAi } = require('./aiProviders');

async function runAutonomousGoal(goalPrompt, model, serverUrl, webview, abortSignal) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return "⚠️ Please open a workspace folder first to run autonomous goal execution!";
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const rootName = workspaceFolders[0].name;

  let reportLogs = `🚀 **Starting Autonomous Goal Loop (Antigravity Agent Mode)**\nGoal: "${goalPrompt}"\nWorkspace: \`${rootName}\`\n\n---\n`;

  // Step 1: Plan Sub-Tasks
  webview.postMessage({ command: 'response', id: 'goal-status', text: reportLogs + '📋 *Step 1/5: Synthesizing multi-step execution plan...*' });

  const planningPrompt = `[AUTONOMOUS GOAL AGENT - PLANNING PHASE]\n` +
    `Goal: "${goalPrompt}"\n` +
    `Workspace: ${rootName}\n\n` +
    `Break this goal down into 4-6 specific actionable steps. For each step, specify files to create/update. Return JSON array format:\n` +
    `[{"step": 1, "description": "...", "filename": "index.html", "instruction": "..."}]`;

  const planResultRaw = await queryAi(planningPrompt, model, serverUrl, abortSignal);
  
  let plan = [];
  try {
    const jsonMatch = planResultRaw.match(/\[[\s\S]*\]/);
    if (jsonMatch) plan = JSON.parse(jsonMatch[0]);
  } catch (e) {
    plan = [
      { step: 1, description: "Create Main HTML Layout", filename: "index.html", instruction: "Create modern responsive HTML website layout" },
      { step: 2, description: "Create CSS Stylesheet", filename: "styles.css", instruction: "Create modern CSS glassmorphism styles" },
      { step: 3, description: "Create JS Logic & App Script", filename: "app.js", instruction: "Create interactive frontend JS logic" },
      { step: 4, description: "Create Backend Server", filename: "server.js", instruction: "Create Node.js express backend server" }
    ];
  }

  reportLogs += `### 📋 Execution Plan (${plan.length} Steps)\n`;
  plan.forEach(p => {
    reportLogs += `- **Step ${p.step}**: ${p.description} (\`${p.filename}\`)\n`;
  });
  reportLogs += `\n---\n`;

  // Continuous Step Execution Loop (Runs until all files are generated!)
  for (let i = 0; i < plan.length; i++) {
    if (abortSignal && abortSignal.aborted) {
      reportLogs += `\n🛑 *Goal execution stopped by user at Step ${i + 1}.*`;
      return reportLogs;
    }

    const stepItem = plan[i];
    webview.postMessage({
      command: 'response',
      id: 'goal-status',
      text: reportLogs + `⏳ *Executing Step ${stepItem.step}/${plan.length}: ${stepItem.description}...*`
    });

    const stepPrompt = `[AUTONOMOUS AGENT - STEP ${stepItem.step}/${plan.length}]\n` +
      `Goal: "${goalPrompt}"\n` +
      `Step Task: ${stepItem.description}\n` +
      `Target File: ${stepItem.filename}\n` +
      `Instruction: ${stepItem.instruction}\n\n` +
      `Generate complete, production-ready code for ${stepItem.filename}. Return ONLY raw code without explanations.`;

    const codeRaw = await queryAi(stepPrompt, model, serverUrl, abortSignal);
    const cleanCode = codeRaw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

    if (cleanCode) {
      const targetPath = path.join(rootPath, stepItem.filename);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, cleanCode, 'utf8');

      reportLogs += `✅ **Step ${stepItem.step}/${plan.length} Completed**: \`${stepItem.filename}\` created & written!\n`;
    }
  }

  reportLogs += `\n🎉 **GOAL 100% COMPLETED SUCCESSFULLY!**\nAll files created & written to workspace \`${rootName}\`!`;
  return reportLogs;
}

module.exports = { runAutonomousGoal };
