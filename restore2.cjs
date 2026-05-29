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
    
    // Check if it's a tool response
    if (entry.type === 'TOOL_RESPONSE' && entry.content) {
      // Look for the ctx_read output
      // Let's just dump any JSON-like tool response that might contain file contents
      if (entry.content.includes('.md') || entry.content.includes('.json')) {
        console.log("Found a potential match:", entry.content.substring(0, 100));
      }
    }
    
    // Also check tool calls for ctx_read to get exact paths
    if (entry.type === 'MODEL_RESPONSE' && entry.tool_calls) {
       for (const call of entry.tool_calls) {
          if (call.name && call.name.includes('ctx_read')) {
              console.log("Found ctx_read call for:", call.arguments);
          }
          if (call.name === 'default_api:view_file') {
              console.log("Found view_file call for:", call.arguments);
          }
       }
    }
  } catch (e) {
    // ignore parsing errors
  }
}
console.log('Done.');
