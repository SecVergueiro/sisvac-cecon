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
  const matId = '7712c1df-de23-4ae0-bde4-7fa1c3ac2b3a';

  const r1 = await supabase.from('saldos_ferias').insert({ id_matricula: matId, id_exercicio: 4, dias_direito: 30, dias_utilizados: 0, dias_disponiveis: 30 });
  console.log('Saldo 2024:', r1.error?.message || '✅ OK');

  const r2 = await supabase.from('saldos_ferias').insert({ id_matricula: matId, id_exercicio: 5, dias_direito: 30, dias_utilizados: 0, dias_disponiveis: 30 });
  console.log('Saldo 2025:', r2.error?.message || '✅ OK');

  // Verificar
  const { data } = await supabase.from('saldos_ferias').select('*').eq('id_matricula', matId);
  console.log('\nSaldos no banco:', data?.length || 0);
}

run();
