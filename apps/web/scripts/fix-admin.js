const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src/app');
let count = 0;

files.forEach(file => {
  if (file.includes('Configuracoes') || file.includes('MeuPainel') || file.includes('layout.tsx')) return;

  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('aside className="sidebar"')) return;
  if (!content.includes('Sistema')) return;

  const replaceTarget = /<div className="sb-section">\s*Sistema\s*<\/div>[\s\S]*?<\/aside>/;
  const newBlock = `<div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>
            <div className="nav-item" onClick={() => signOut({ callbackUrl:'/auth/login' })} style={{ color: 'rgba(220,38,38,.8)', marginBottom: 8 }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,38,38,.15)'; e.currentTarget.style.color = '#fecaca' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,.8)' }}><Icon t="logout" /> Sair do sistema</div>
            <AdminUserCard />
          </div>
        </aside>`;

  if (replaceTarget.test(content)) {
    content = content.replace(replaceTarget, newBlock);
    
    // Ensure AdminUserCard import
    if (!content.includes('AdminUserCard')) {
      const importMatches = content.match(/import .* from ['"]next\/navigation['"]/);
      if (importMatches) {
        content = content.replace(importMatches[0], importMatches[0] + "\nimport AdminUserCard from '@/components/AdminUserCard'");
      } else {
         content = "import AdminUserCard from '@/components/AdminUserCard'\n" + content;
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    count++;
  } else {
    // try removing just the "Sistema" label and following block
    console.log("Could not match target on", file);
  }
});

console.log('Total files fixed:', count);
