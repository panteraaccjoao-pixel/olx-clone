const fs = require('fs');

const lines = fs.readFileSync('C:/Users/seven/.gemini/antigravity-ide/brain/f04fdf2c-2b81-491b-9808-629a85352198/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const d = JSON.parse(line);
    if (d.step_index === 272) {
      const imgMatches = d.content.match(/https:\/\/img\.olx\.com\.br\/images\/[^\s"'\\]+/g) || [];
      console.log('Images in step 272:', [...new Set(imgMatches)]);
    }
  } catch (e) {}
}
