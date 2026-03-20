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

async function describeTable(table) {
  // Tenta inserir um registro vazio para forçar o Supabase a retornar os nomes das colunas no erro
  const { error } = await supabase.from(table).insert({});
  console.log(`\n=== ${table} ===`);
  console.log(error?.message || 'Sem erro (tabela aceita inserção vazia?)');
  
  // Tenta um select para ver o que vem
  const { data, error: selErr } = await supabase.from(table).select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Colunas (de dados existentes):', Object.keys(data[0]));
  } else if (data) {
    console.log('Tabela vazia, sem dados para inferir colunas');
  }
  if (selErr) console.log('Select error:', selErr.message);
}

async function run() {
  await describeTable('cargos');
  await describeTable('setores');
  await describeTable('funcionarios');
  await describeTable('matriculas');
  await describeTable('exercicios');
  await describeTable('saldos_ferias');
}

run();
