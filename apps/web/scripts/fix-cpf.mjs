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
  const { data, error } = await supabase
    .from('profiles')
    .update({ cpf_validado: true, ativo: true })
    .in('email', ['admin@fcecon.am.gov.br', 'servidor@fcecon.am.gov.br'])
    .select('email, cpf_validado, ativo');

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('✅ Profiles atualizados com sucesso:');
    data.forEach(p => console.log(`   ${p.email} → cpf_validado: ${p.cpf_validado}, ativo: ${p.ativo}`));
  }
}

run();
