const https = require('https');
const http = require('http');

async function performLiveWebSearch(query) {
  return new Promise((resolve) => {
    const cleanQuery = encodeURIComponent(query.replace(/^\/research\s*/, '').trim());
    const url = `https://html.duckduckgo.com/html/?q=${cleanQuery}`;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    }, (res) => {
      let html = '';
      res.on('data', c => html += c);
      res.on('end', () => {
        try {
          const results = [];
          const regex = /<a class="result__url" href="([^"]+)".*?>([\s\S]*?)<\/a>/g;
          let match;
          while ((match = regex.exec(html)) !== null && results.length < 5) {
            let link = match[1];
            if (link.includes('uddg=')) {
              link = decodeURIComponent(link.split('uddg=')[1].split('&')[0]);
            }
            const title = match[2].replace(/<[^>]+>/g, '').trim();
            if (link.startsWith('http')) {
              results.push({ title: title || link, url: link });
            }
          }

          if (results.length === 0) {
            resolve(`*Live Web Search Query:* \`${query}\`\n\n*Web Search Status:* Live query performed across web sources.`);
          } else {
            let snippet = `### 🌐 Live Online Web Search Results for: "${query}"\n`;
            results.forEach((r, idx) => {
              snippet += `[${idx + 1}] [${r.title}](${r.url})\n`;
            });
            resolve(snippet);
          }
        } catch (e) {
          resolve(`*Live Web Search Query:* \`${query}\``);
        }
      });
    });

    req.on('error', () => {
      resolve(`*Live Web Search Query:* \`${query}\``);
    });
  });
}

module.exports = { performLiveWebSearch };
