const fs = require('fs');
const transcriptPath = 'C:/Users/seven/.gemini/antigravity-ide/brain/6f763eb9-11b0-4e42-a226-43de5b74ad81/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('sc-206a520e-0 hcMizQ')) {
    const obj = JSON.parse(lines[i]);
    const content = obj.content || '';
    const start = content.indexOf('<div id="main"');
    const end = content.lastIndexOf('</div>');
    if (start !== -1 && end !== -1) {
      const snippet = content.slice(start, end + 6);
      fs.writeFileSync('perfil_snippet.html', snippet);
      console.log('Saved perfil_snippet.html, length:', snippet.length);
      break;
    }
  }
}
