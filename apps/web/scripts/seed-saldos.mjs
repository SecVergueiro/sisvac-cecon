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
  // Buscar a matrícula do servidor
  const { data: mat } = await supabase.from('matriculas').select('id').eq('matricula', '20000-0').single();
  if (!mat?.id) { console.error('Matrícula 20000-0 não encontrada!'); return; }
  console.log('Matrícula:', mat.id);

  // Criar exercícios
  console.log('Criando exercícios...');
  let ex24, ex25;
  
  const { data: e24, error: e24err } = await supabase.from('exercicios').insert({ ano_inicial: 2024, ano_final: 2024 }).select().single();
  if (e24err) {
    const { data: existing } = await supabase.from('exercicios').select('*').eq('ano_inicial', 2024).single();
    ex24 = existing;
    console.log('  ♻ Exercício 2024 existente:', ex24?.id);
  } else {
    ex24 = e24;
    console.log('  ✅ Exercício 2024:', ex24?.id);
  }
  
  const { data: e25, error: e25err } = await supabase.from('exercicios').insert({ ano_inicial: 2025, ano_final: 2025 }).select().single();
  if (e25err) {
    const { data: existing } = await supabase.from('exercicios').select('*').eq('ano_inicial', 2025).single();
    ex25 = existing;
    console.log('  ♻ Exercício 2025 existente:', ex25?.id);
  } else {
    ex25 = e25;
    console.log('  ✅ Exercício 2025:', ex25?.id);
  }

  // Saldos
  console.log('Criando saldos...');
  if (ex24?.id) {
    const { error } = await supabase.from('saldos_ferias').insert({ id_matricula: mat.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0, dias_disponiveis: 30, avos_adquiridos: 12 });
    console.log(error ? `  ⚠ Saldo 2024: ${error.message}` : '  ✅ Saldo 2024 OK');
  }
  if (ex25?.id) {
    const { error } = await supabase.from('saldos_ferias').insert({ id_matricula: mat.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0, dias_disponiveis: 30, avos_adquiridos: 12 });
    console.log(error ? `  ⚠ Saldo 2025: ${error.message}` : '  ✅ Saldo 2025 OK');
  }

  console.log('\n🎉 Exercícios e Saldos criados!');
}

run();
