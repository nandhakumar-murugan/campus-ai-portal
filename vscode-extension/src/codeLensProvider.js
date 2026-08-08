const vscode = require('vscode');

class CampusCodeLensProvider {
  provideCodeLenses(document, token) {
    const lenses = [];
    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match function declarations, methods, and classes
      if (/^\s*(def|function|class|async function|public static|private|public|class)\s+([a-zA-Z0-9_]+)/.test(line)) {
        const range = new vscode.Range(i, 0, i, line.length);

        lenses.push(
          new vscode.CodeLens(range, {
            title: "✨ Refactor",
            command: "campusAi.refactorFunction",
            arguments: [document, range]
          }),
          new vscode.CodeLens(range, {
            title: "🧪 Write Tests",
            command: "campusAi.generateTests",
            arguments: [document, range]
          }),
          new vscode.CodeLens(range, {
            title: "🧠 Explain",
            command: "campusAi.explainFunction",
            arguments: [document, range]
          })
        );
      }
    }
    return lenses;
  }
}

// Code Action Provider for Diagnostic Auto-Fix squiggles!
class CampusCodeActionProvider {
  provideCodeActions(document, range, context, token) {
    if (!context.diagnostics || context.diagnostics.length === 0) return [];

    const action = new vscode.CodeAction('⚡ Fix Error with Campus AI', vscode.CodeActionKind.QuickFix);
    action.command = {
      command: 'campusAi.fixFileErrors',
      title: 'Fix Error with Campus AI'
    };
    action.isPreferred = true;
    return [action];
  }
}

module.exports = { CampusCodeLensProvider, CampusCodeActionProvider };
