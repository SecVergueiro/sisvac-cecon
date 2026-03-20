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
  const { data: kps } = await supabase.from('vw_dashboard_kpis').select('*').single();
  console.log('--- KPIs no BD ---');
  console.log(kps);

  const { data: func } = await supabase.from('funcionarios').select('id, nome');
  console.log('\n--- Qtd Funcionários no BD ---');
  console.log(func?.length);

  const { data: sol } = await supabase.from('solicitacoes').select('id, status');
  console.log('\n--- Qtd Solicitações no BD ---');
  console.log(sol?.length);

  console.log('\nFim da checagem.');
}

run();
