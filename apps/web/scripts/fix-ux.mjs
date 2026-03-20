import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Substituições da palavra gozo -> descanso
  const replaces = [
    { from: /Em gozo/g, to: 'Em descanso' },
    { from: /em gozo/g, to: 'em descanso' },
    { from: /EM_GOZO:    'Em gozo'/g, to: "EM_GOZO:    'Em descanso'" },
    { from: /EM_GOZO:   'Em gozo'/g, to: "EM_GOZO:   'Em descanso'" },
    { from: /EM_GOZO:\t'Em gozo'/g, to: "EM_GOZO:\t'Em descanso'" },
    { from: /Início e retorno de gozo/g, to: 'Início e retorno de descanso' },
    { from: /apiIniciarGozo/g, to: 'apiIniciarDescanso' },
    { from: /iniciar-gozo/g, to: 'iniciar-descanso' },
    { from: /servidoresEmGozo/g, to: 'servidoresEmDescanso' },
    { from: /servidores_em_gozo_hoje/g, to: 'servidores_em_descanso_hoje' },
    { from: /ServidorEmGozo/g, to: 'ServidorEmDescanso' },
    { from: /getServidoresEmGozo/g, to: 'getServidoresEmDescanso' }
  ];

  for (const r of replaces) {
    if (content.match(r.from)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  }

  // 2. Ajuste Infalível de CSS da Sidebar:
  // Fazer a própria Sidebar ser scrollável caso a tela seja pequena
  if (content.includes('.sidebar{')) {
    // Garante que a sidebar tenha overflow-y: auto pra evitar corte
    if (!content.includes('overflow-y:auto') || content.match(/\.sidebar\{[^}]*overflow-y/)) {
      content = content.replace(/\.sidebar\{width:2[^;]+;min-width:2[^;]+;background:var\(--navy\);display:flex;flex-direction:column;position:relative\}/g, 
        '.sidebar{width:232px;min-width:232px;background:var(--navy);display:flex;flex-direction:column;position:relative;overflow-y:auto;overflow-x:hidden}');
      content = content.replace(/\.sidebar\{width:220px;min-width:220px;background:var\(--navy\);display:flex;flex-direction:column;position:relative\}/g, 
        '.sidebar{width:220px;min-width:220px;background:var(--navy);display:flex;flex-direction:column;position:relative;overflow-y:auto;overflow-x:hidden}');
      changed = true;
    }
  }

  // E para evitar que a flexbox do .sb-nav empurre o restante para fora, tiramos o flex:1 do sb-nav e deixamos ele crescer naturalmente
  if (content.includes('.sb-nav{flex:1;')) {
    content = content.replace(/\.sb-nav\{flex:1;/g, '.sb-nav{flex:none;');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modificado:', file);
  }
});
