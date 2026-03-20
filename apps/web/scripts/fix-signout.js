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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('signOut') && !content.includes('next-auth/react')) {
    if (content.includes("import { useRouter } from 'next/navigation'")) {
      content = content.replace("import { useRouter } from 'next/navigation'", "import { useRouter } from 'next/navigation'\nimport { signOut } from 'next-auth/react'");
    } else {
      content = "import { signOut } from 'next-auth/react'\n" + content;
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added signOut import to', file);
  }
});
