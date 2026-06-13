const fs = require('fs');
const code = fs.readFileSync('/Users/artsrunkarapetyan/Documents/projects/syncarts/src/components/layout/Sidebar.tsx', 'utf8');

// Poor man's JSX tag matcher to find the mismatched tag
let lines = code.split('\n');
let stack = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // Simple regex for tags, ignoring props for simplicity, handles self-closing
  let tags = line.match(/<\/?([A-Za-z0-9_]+)(?![^>]*\/>)[^>]*>/g) || [];
  for (let tag of tags) {
    if (tag.startsWith('</')) {
      let tagName = tag.match(/<\/([A-Za-z0-9_]+)/)[1];
      if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
        stack.pop();
      } else {
        console.log(`Mismatch at line ${i + 1}: expected </${stack.length ? stack[stack.length - 1].name : 'none'}> but got ${tag}`);
      }
    } else if (tag.startsWith('<')) {
      // not self-closing
      let tagName = tag.match(/<([A-Za-z0-9_]+)/)[1];
      stack.push({ name: tagName, line: i + 1 });
    }
  }
}
console.log('Unclosed tags remaining:', stack.map(s => `${s.name} at line ${s.line}`));
