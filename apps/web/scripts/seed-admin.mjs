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
  console.log('-------------------------------------------');
  console.log('🛡️ CADASTRANDO SUPER ADMIN (RH) MESTRE 🛡️');
  console.log('-------------------------------------------');

  const email = 'admin@fcecon.am.gov.br';
  const cpf = '000.000.000-00';
  const password = 'admin';

  console.log('1. Vendo se usuário já existe na lista de Auth...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find(u => u.email === email);
  
  let userId;
  if (existing) {
    console.log('Usuário encontrado! Atualizando a senha para garantir o acesso...');
    userId = existing.id;
    await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    console.log('Criando novo usuário Auth...');
    const { data: user, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) {
      console.error('Erro fatal:', authErr.message);
      return;
    }
    userId = user.user.id;
  }
  
  console.log('>> Auth UID:', userId);

  console.log('2. Forçando Cargo Administrativo (Role = RH) na Tabela de Profiles...');
  await supabase.from('profiles').upsert({ id: userId, nome: 'Diretor Supremo (RH)', cpf, email, role: 'RH' });

  console.log('3. Inserindo Funcionario e Matrícula Administrativa...');
  const { data: func } = await supabase.from('funcionarios').upsert({ cpf, nome: 'Diretor Supremo (RH)', tipo_vinculo: 'ESTATUTARIO' }).select('id').single();
  
  if (func) {
    const { data: m } = await supabase.from('matriculas').select('id').eq('id_funcionario', func.id).single();
    if (!m) {
       const { data: cargo } = await supabase.from('cargos').insert({ nome: 'Gestor de RH', ch_semanal: 40 }).select('id').single();
       const { data: setor } = await supabase.from('setores').insert({ sigla: 'RH-DIR', nome: 'Diretoria de Recursos Humanos' }).select('id').single();
       if (cargo && setor) {
         await supabase.from('matriculas').insert({ id_funcionario: func.id, matricula: '10000-0', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2000-01-01', ativo: true });
       }
    } else {
       console.log('Matrícula já existe para este funcionário. Pulando...');
    }
  }

  console.log('\n✅ SUCESSO ABSOLUTO!');
  console.log('----------------------------------------------------');
  console.log(`🔑 Login (E-mail): ${email}`);
  console.log(`🔑 Login (CPF)   : ${cpf}`);
  console.log(`🔑 Senha         : ${password}`);
  console.log('----------------------------------------------------');
  console.log('Você já pode fazer o Login!');
}

run();
