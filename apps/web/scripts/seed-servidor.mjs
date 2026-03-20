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
  const email = 'servidor@fcecon.am.gov.br';
  const cpf = '111.111.111-11';
  const password = '123456';

  console.log('1. Verificando/Criando usuário Servidor no Auth...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find(u => u.email === email);
  
  let userId;
  if (existing) {
    userId = existing.id;
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    const { data: user } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    userId = user.user.id;
  }

  console.log('2. Criando o Profile (Role = SERVIDOR)...');
  await supabase.from('profiles').upsert({ id: userId, nome: 'João Servidor (Teste)', cpf, email, role: 'SERVIDOR' });

  console.log('3. Criando Funcionário e Matrícula...');
  const { data: func } = await supabase.from('funcionarios').upsert({ cpf, nome: 'João Servidor (Teste)', tipo_vinculo: 'CELETISTA' }).select('id').single();
  
  if (func) {
    const { data: m } = await supabase.from('matriculas').select('id').eq('id_funcionario', func.id).single();
    let matId = m?.id;
    if (!matId) {
       const { data: cargo } = await supabase.from('cargos').insert({ nome: 'Analista de Sistemas', ch_semanal: 40 }).select('id').single();
       const { data: setor } = await supabase.from('setores').insert({ sigla: 'TI', nome: 'Tecnologia' }).select('id').single();
       if (cargo && setor) {
         const { data: novaMat } = await supabase.from('matriculas').insert({ id_funcionario: func.id, matricula: '20000-0', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2015-06-01', ativo: true }).select('id').single();
         matId = novaMat?.id;
       }
    }
    
    // Injetar saldo de férias para ele poder testar!
    if (matId) {
       console.log('4. Injetando Saldo de Férias para Teste...');
       // Garante Exercício 2024 e 2025
       const { data: ex24 } = await supabase.from('exercicios').upsert({ descricao: '2024', data_inicio: '2024-01-01', data_fim: '2024-12-31', ativo: true }, { onConflict: 'descricao' }).select('id').single();
       const { data: ex25 } = await supabase.from('exercicios').upsert({ descricao: '2025', data_inicio: '2025-01-01', data_fim: '2025-12-31', ativo: true }, { onConflict: 'descricao' }).select('id').single();
       
       if (ex24) await supabase.from('saldos_ferias').upsert({ id_matricula: matId, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0, avos_adquiridos: 12 }, { onConflict: 'id_matricula,id_exercicio' });
       if (ex25) await supabase.from('saldos_ferias').upsert({ id_matricula: matId, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0, avos_adquiridos: 12 }, { onConflict: 'id_matricula,id_exercicio' });
    }
  }

  console.log('✅ Servidor de Teste Criado com Sucesso!');
}

run();
