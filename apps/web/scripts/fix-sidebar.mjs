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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const basename = path.basename(file);

  // ═══════════════════════════════════════════════════════
  // PROBLEMA 1: Remover o card "Minha Conta"/"Gestor RH" 
  // de TODAS as sidebars admin (exceto ConfiguracoesClient 
  // que já foi tratado com o botão de Sair estilizado)
  // ═══════════════════════════════════════════════════════
  
  if (basename !== 'ConfiguracoesClient.tsx' && basename !== 'MeuPainelClient.tsx') {
    // Padrão 1: <div className="sb-user" onClick={...}> ... </div> (com onClick)
    const sbUserWithOnClick = /<div className="sb-user"[^>]*onClick[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    // Padrão 2: <div className="sb-user"> ... </div> (sem onClick)  
    const sbUserNoOnClick = /<div className="sb-user">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    
    // Abordagem mais segura: procura e remove bloco sb-user inteiro
    // O padrão real é: <div className="sb-user"...>AVATAR+TEXT</div> fechado antes do </aside>
    
    // Regex que captura o bloco sb-user até encontrar </aside>
    const lines = content.split('\n');
    let inSbUser = false;
    let sbUserStart = -1;
    let sbUserEnd = -1;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('className="sb-user"') || lines[i].includes("className='sb-user'")) {
        inSbUser = true;
        sbUserStart = i;
        braceCount = 0;
      }
      if (inSbUser) {
        // Count JSX div open/close
        const opens = (lines[i].match(/<div/g) || []).length;
        const closes = (lines[i].match(/<\/div>/g) || []).length;
        braceCount += opens - closes;
        if (braceCount <= 0 && lines[i].includes('</div>')) {
          sbUserEnd = i;
          break;
        }
      }
    }
    
    if (sbUserStart >= 0 && sbUserEnd >= 0) {
      // Remove the sb-user block
      lines.splice(sbUserStart, sbUserEnd - sbUserStart + 1);
      content = lines.join('\n');
      changed = true;
      console.log(`  ✂️ Removido card Minha Conta de: ${basename} (linhas ${sbUserStart+1}-${sbUserEnd+1})`);
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
  }
});

console.log(`\n✅ Total de arquivos modificados: ${totalChanges}`);
