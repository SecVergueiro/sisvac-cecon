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
  const cpf = '111.111.111-11';

  const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'servidor@fcecon.am.gov.br').single();
  console.log('1. Profile:', JSON.stringify(profile, null, 2));

  const { data: func } = await supabase.from('funcionarios').select('*').eq('cpf', cpf).single();
  console.log('\n2. Funcionario:', JSON.stringify(func, null, 2));

  const { data: mat } = await supabase.from('matriculas').select('*').eq('id_funcionario', func?.id).single();
  console.log('\n3. Matricula:', JSON.stringify(mat, null, 2));

  const { data: view, error: viewErr } = await supabase.from('vw_servidores_busca').select('*').eq('cpf', cpf);
  console.log('\n4. View vw_servidores_busca:', JSON.stringify(view, null, 2));
  if (viewErr) console.error('View Error:', viewErr);

  // Check cargos e setores
  const { data: cargos } = await supabase.from('cargos').select('*');
  console.log('\n5. Cargos:', JSON.stringify(cargos, null, 2));

  const { data: setores } = await supabase.from('setores').select('*');
  console.log('\n6. Setores:', JSON.stringify(setores, null, 2));
}

run();
