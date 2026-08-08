const vscode = require('vscode');
const { queryAi } = require('./aiProviders');

class CampusInlineCompletionItemProvider {
  constructor(getServerUrl) {
    this._getServerUrl = getServerUrl;
  }

  async provideInlineCompletionItems(document, position, context, token) {
    // Get text before cursor (up to 50 lines)
    const startLine = Math.max(0, position.line - 50);
    const prefixRange = new vscode.Range(new vscode.Position(startLine, 0), position);
    const prefixText = document.getText(prefixRange);

    // Get text after cursor (up to 20 lines)
    const endLine = Math.min(document.lineCount - 1, position.line + 20);
    const suffixRange = new vscode.Range(position, new vscode.Position(endLine, 100));
    const suffixText = document.getText(suffixRange);

    if (!prefixText.trim()) return [];

    const prompt = `You are an AI code completion assistant like GitHub Copilot. Complete the code following the prefix below. Output ONLY raw code completion, no markdown code blocks, no explanation.\n\nFile language: ${document.languageId}\n\nPrefix code:\n${prefixText}\n\nSuffix code:\n${suffixText}\n\nCompletion:`;

    try {
      const serverUrl = this._getServerUrl();
      const completion = await queryAi(prompt, 'qwen-2.5-coder', serverUrl);
      if (!completion || token.isCancellationRequested) return [];

      // Clean completion text
      const cleanCompletion = completion.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trimStart();
      if (!cleanCompletion) return [];

      return [
        new vscode.InlineCompletionItem(
          cleanCompletion,
          new vscode.Range(position, position)
        )
      ];
    } catch (e) {
      return [];
    }
  }
}

module.exports = { CampusInlineCompletionItemProvider };
