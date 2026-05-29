const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\736ff185-12f7-4a2f-a921-ced9dd403987\\.system_generated\\logs\\transcript.jsonl';
const outDir = 'C:\\Users\\Hp\\MoonPlayer\\.restored';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const entry = JSON.parse(line);
    
    // Look for tool responses
    if (entry.type === 'TOOL_RESPONSE' && entry.content) {
      // Find "File Path: `file:///c:/Users/Hp/MoonPlayer/..." (case insensitive for drive letter)
      const match = entry.content.match(/File Path: `file:\/\/\/[a-zA-Z]:\/Users\/Hp\/MoonPlayer\/([^`]+)`/i);
      if (match) {
        let filePath = match[1];
        let fileContent = entry.content;
        
        // Extract the actual file content which is usually after "The following code has been modified..."
        const contentMatch = fileContent.match(/The following code has been modified to include a line number before every line[^\n]*\n((?:\d+: .*\n?)+)/);
        if (contentMatch) {
          let linesWithNumbers = contentMatch[1].split('\n');
          let actualContent = linesWithNumbers.map(l => l.replace(/^\d+: /, '')).join('\n');
          // removing trailing newlines from split
          if (actualContent.endsWith('\n')) {
              actualContent = actualContent.slice(0, -1);
          }
          
          const fullPath = path.join(outDir, filePath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, actualContent);
          console.log(`Restored: ${filePath}`);
        }
      }
    }
  } catch (e) {
    // ignore parsing errors
  }
}
console.log('Done.');
