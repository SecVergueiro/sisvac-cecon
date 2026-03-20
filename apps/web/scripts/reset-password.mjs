import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...vals] = line.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = 'admin@fcecon.am.gov.br';
  const newPassword = '123456'; // Padrão seguro min 6 chars

  console.log('Buscando usuário administrador...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find(u => u.email === email);
  
  if (existing) {
    console.log('Forçando redefinição de senha para 123456...');
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password: newPassword });
    if (error) {
      console.error('Erro ao redefinir:', error.message);
    } else {
      console.log('✅ Senha redefinida com sucesso para o mínimo de 6 caracteres do Supabase!');
    }
  } else {
    console.log('Usuário não encontrado. Crie novamente.');
  }
}

run();
