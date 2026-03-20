const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.join(__dirname, 'src');

walk(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Login Page replace Background
    if (filePath.replace(/\\/g,'/').includes('auth/login/page.tsx')) {
      content = content.replace("url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80')", "url('/bg-login.jpg')");
      
      // Also replace logo in login page
      let loginLogoRegex = /<div className="ll-logo">[\\s\\S]*?<span className="ll-logo-name">.*?<\\/span>\\s*<\\/div>/;
      content = content.replace(loginLogoRegex, `<div className="ll-logo">
              <img src="/logo.png" alt="Logo" style={{ maxHeight: '56px', objectFit: 'contain' }} />
            </div>`);
      changed = true;
    }

    // Sidebar replace logo
    let sidebarLogoRegex = /<div className="sb-logo">[\\s\\S]*?<span className="sb-logo-name">.*?<\\/span>\\s*<\\/div>/;
    if (sidebarLogoRegex.test(content) && !filePath.includes('auth/login')) {
      content = content.replace(sidebarLogoRegex, `<div className="sb-logo" style={{ padding: '24px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="SISVAC" style={{ maxHeight: '48px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>`);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Patched', filePath);
    }
  }
});
