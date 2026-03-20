const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    let dp = path.join(dir, f);
    if (fs.statSync(dp).isDirectory()) files = files.concat(walk(dp));
    else files.push(dp);
  });
  return files;
}

const allFiles = walk(path.join(__dirname, 'src'));
allFiles.forEach(f => {
  if (f.endsWith('.tsx') && !f.includes('auth')) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace old SVG icon variants
    let newContent = content.replace(/<div className="sb-logo">[\s\S]*?<\/div>[\s\S]*?<span className="sb-logo-name">SISVAC<\/span>\s*<\/div>/g, 
      '<div className="sb-logo" style={{ display: "flex", justifyContent: "center", padding: "24px 18px 10px" }}>\n            <img src="/logomore.png" alt="Logo SISVAC" style={{ maxHeight: "42px", maxWidth: "100%", objectFit: "contain" }} />\n          </div>');
      
    // Replace DashboardClient specific variant
    newContent = newContent.replace(/<div className="sb-logo" style={{ display: 'flex', justifyContent: 'center', padding: '24px 18px 10px' }}>\s*<img src="\/logo\.png".*?<\/div>/g,
      '<div className="sb-logo" style={{ display: "flex", justifyContent: "center", padding: "24px 18px 10px" }}>\n            <img src="/logomore.png" alt="Logo SISVAC" style={{ maxHeight: "42px", maxWidth: "100%", objectFit: "contain" }} />\n          </div>');

    if (newContent !== content) {
      fs.writeFileSync(f, newContent, 'utf8');
      console.log('Patched sidebar logo in', f);
    }
  }
});
