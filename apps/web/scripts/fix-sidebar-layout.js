const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx')) results.push(file);
  });
  return results;
}

const files = walk('./src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix CSS: .sb-nav{flex:none...} -> .sb-nav{flex:1...}
  // This ensures the navigation takes the remaining space and handles its own scrolling, keeping the bottom elements visible.
  if (content.match(/\.sb-nav\s*\{\s*flex:\s*none;/)) {
    content = content.replace(/\.sb-nav\s*\{\s*flex:\s*none;/, '.sb-nav{flex:1;');
    changed = true;
  }

  // 2. Add Configurações link back to sb-nav if it's missing (except for MeuPainel and Configuracoes themselves)
  if (
    content.includes('className="sb-nav"') && 
    !content.includes("router.push('/configuracoes')") &&
    !file.includes('Configuracoes') && !file.includes('meu-painel')
  ) {
    // Find where the last nav-item is inside sb-nav, which is Relatorios or something, and add Configuracoes after it.
    // We can just append it before the closing </div> of <div className="sb-nav">
    // Wait, the regex needs to find the end of the sb-nav block.
    // It's easier: just replace `<div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>`
    // with `<div className="nav-item" onClick={() => router.push('/configuracoes')} style={{ margin: '0 10px' }}><Icon t="settings" />Configurações</div>\n          <div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>`
    
    // Wait, Icon component in the file could be NavIcon or Icon.
    const iconTag = content.includes('<NavIcon') ? 'NavIcon' : 'Icon';
    
    // Some files don't have the explicit margin top auto wrapper yet? We added it in all admin files.
    if (content.includes(`padding: '0 10px 12px'`)) {
      content = content.replace(
        `<div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>`,
        `<div className="sb-section" style={{ marginTop: 24 }}>Sistema</div>\n          <div className="sb-nav" style={{ flex: 0, paddingBottom: 6 }}>\n            <div className="nav-item" onClick={() => router.push('/configuracoes')}><${iconTag} t="settings" />Configurações</div>\n          </div>\n          <div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>`
      );
      changed = true;
    }
  }

  // 3. Fix the "Sistema" text in ConfiguracoesClient itself if it has the old custom Sair button and no AdminUserCard
  if (file.includes('ConfiguracoesClient')) {
     const customSairBlock = `<div className="sb-user" onClick={() => signOut({ callbackUrl:'/auth/login' })} style={{ marginTop: 'auto', background: 'rgba(220,38,38,.08)', borderColor: 'transparent' }}>
            <div className="avatar" style={{ background: 'var(--red)', width: 34, height: 34 }}>
              <Icon t="logout" />
            </div>
            <div>
              <div className="su-name" style={{ color: 'var(--red-border)' }}>Sair do Sistema</div>
              <div className="su-role" style={{ color: 'rgba(255,255,255,0.45)' }}>Clique para desconectar</div>
            </div>
          </div>`;
     if (content.includes("Sair do Sistema") && !content.includes("<AdminUserCard />")) {
       // Let's replace the whole bottom block of ConfiguracoesClient
       // It starts with {/* SAIR MOVIDO PARA O BLOCO FINAL PRA NÃO SUMIR */}
       // We can just replace the old Sair Button with the unified one.
       const newBottom = `<div style={{ marginTop: 'auto', padding: '0 10px 12px' }}>
            <div className="nav-item" onClick={() => signOut({ callbackUrl:'/auth/login' })} style={{ color: 'rgba(220,38,38,.8)', marginBottom: 8 }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(220,38,38,.15)'; e.currentTarget.style.color = '#fecaca' }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,38,38,.8)' }}><Icon t="logout" /> Sair do sistema</div>
            <AdminUserCard />
          </div>`;
       // Using simpler regex to catch the old Sair button
       content = content.replace(/\{\/\* SAIR MOVIDO PARA O BLOCO FINAL PRA NÃO SUMIR \*\/\}[\s\S]*?<\/aside>/, newBottom + '\n        </aside>');
       if (!content.includes("import AdminUserCard")) {
         content = content.replace("import { useRouter }", "import { useRouter }\nimport { signOut } from 'next-auth/react'\nimport AdminUserCard from '@/components/AdminUserCard'");
       }
       changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed CSS and layout for', file);
  }
});
