const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '..');
const ctx = { window: {} };
vm.createContext(ctx);

['topics', 'numbers', 'patterns', 'arrays', 'strings', 'sortsearch'].forEach(f => {
  const code = fs.readFileSync(path.join(baseDir, 'assets/js/data', f + '.js'), 'utf8');
  vm.runInContext(code, ctx);
});

const D = ctx.window.DSA;
const allIds = new Set();
Object.values(D.bank).forEach(arr => arr.forEach(p => allIds.add(p.id)));

const files = ['numbers', 'patterns', 'arrays', 'strings', 'sortsearch'];
files.forEach(f => {
  const filePath = path.join(baseDir, 'assets/js/data', f + '.js');
  let content = fs.readFileSync(filePath, 'utf8');

  D.bank[f].forEach(p => {
    if (!p.related) return;
    const valid = p.related.filter(r => allIds.has(r));
    const finalRelated = valid.length > 0 ? valid : ['arr-sum', 'arr-largest', 'arr-two-sum'].filter(r => allIds.has(r));

    if (valid.length !== p.related.length) {
      // Find the specific problem section
      const regex = new RegExp('(id:\\s*"' + p.id + '"[\\s\\S]*?related:\\s*\\[)[^\\]]*(\\])');
      content = content.replace(regex, function(match, p1, p2) {
        return p1 + finalRelated.map(id => '"' + id + '"').join(', ') + p2;
      });
    }
  });

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Cleaned dangling related IDs successfully.');
