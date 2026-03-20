const fs = require('fs');
const path = require('path');

const files = [
  { path: 'src/app/dashboard/DashboardClient.tsx', variant: 'admin', active: 'inicio', addPendentes: 'kpis.pendentesAprovacao' },
  { path: 'src/app/aprovacoes/AprovacoesClient.tsx', variant: 'admin', active: 'aprovacoes', addPendentes: 'pendentes.length' },
  { path: 'src/app/ferias/FeriasClient.tsx', variant: 'admin', active: 'ferias' },
  { path: 'src/app/servidores/ServidoresClient.tsx', variant: 'admin', active: 'servidores' },
  { path: 'src/app/servidores/novo/NovoServidorClient.tsx', variant: 'admin', active: 'servidores' },
  { path: 'src/app/servidores/[id]/ServidorDetalheClient.tsx', variant: 'admin', active: 'servidores' },
  { path: 'src/app/relatorios/page.tsx', variant: 'admin', active: 'relatorios' },
  { path: 'src/app/meu-painel/MeuPainelClient.tsx', variant: 'servidor', isMeuPainel: true },
  { path: 'src/app/configuracoes/ConfiguracoesClient.tsx', isConfig: true },
];

files.forEach(f => {
  const filepath = path.resolve(__dirname, f.path);
  if (!fs.existsSync(filepath)) {
    console.error('File not found', f.path);
    return;
  }
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace <aside className="sidebar">...</aside>
  // using regex. 
  // We need to account for nested divs inside the aside.
  // We can just match <aside className="sidebar"> until </aside>
  
  let newSidebarStr = '';
  if (f.isMeuPainel) {
    newSidebarStr = `<Sidebar variant="servidor" activeItem={tab} onItemClick={(id) => setTab(id as Tab)} />`;
  } else if (f.isConfig) {
    newSidebarStr = `<Sidebar variant={isAdmin ? 'admin' : 'servidor'} activeItem="configuracoes" />`;
  } else {
    let pendentesAttr = f.addPendentes ? ` pendentesCount={${f.addPendentes}}` : '';
    newSidebarStr = `<Sidebar variant="${f.variant}" activeItem="${f.active}"${pendentesAttr} />`;
  }

  // Next, update the imports.
  // Add: import Sidebar from '@/components/Sidebar'
  if (!content.includes('import Sidebar from')) {
    content = content.replace("import { useState", "import Sidebar from '@/components/Sidebar'\nimport { useState");
    // Fallback if there is no import { useState
    if (!content.includes("import Sidebar from")) {
       content = content.replace("import", "import Sidebar from '@/components/Sidebar'\nimport");
    }
  }

  // Remove AdminUserCard since it's now internal to the Sidebar
  content = content.replace(/import AdminUserCard.*\n/g, '');
  
  // Replace the aside tag
  content = content.replace(/<aside\s+className="sidebar"[\s\S]*?<\/aside>/, newSidebarStr);

  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Processed', f.path);
});
