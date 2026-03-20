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

async function ins(table, data) {
  const { data: r, error } = await supabase.from(table).insert(data).select().single();
  if (error) {
    // busca existente
    for (const key of ['nome', 'cpf', 'matricula', 'sigla', 'ano_inicial']) {
      if (data[key] !== undefined) {
        const { data: ex } = await supabase.from(table).select('*').eq(key, data[key]).single();
        if (ex) { console.log(`  ♻ [${table}] Reusando (id=${ex.id})`); return ex; }
      }
    }
    console.log(`  ❌ [${table}] ${error.message}`);
    return null;
  }
  console.log(`  ✅ [${table}] id=${r.id}`);
  return r;
}

async function wipeDatabase() {
  console.log('\n🧹 Iniciando Limpeza Profunda (Wipe)...');

  // 1. Apaga todos os logins do Supabase Auth (Isso apaga os profiles via CASCADE)
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('❌ Erro ao listar usuários do Auth:', usersError);
  } else if (usersData && usersData.users.length > 0) {
    console.log(`   Apagando ${usersData.users.length} usuários antigos...`);
    for (const user of usersData.users) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  // 2. Chama a função SQL para limpar o resto das tabelas transacionais
  const { error: rpcError } = await supabase.rpc('fn_limpar_banco_demo');
  if (rpcError) {
    console.error('❌ Erro ao executar fn_limpar_banco_demo:', rpcError);
    throw rpcError;
  }
  console.log('✅ Banco de dados limpo e zerado!');
}

async function createVisitorLogin() {
  console.log('\n👥 Criando Contas de Demonstração (Admin, RH e Servidor)...');

  // Definindo as 3 contas que o recrutador poderá usar
  const contas = [
    {
      email: 'rh@sisvac.com',
      role: 'RH',
      cpf: '000.000.000-00', // Liga com o "Gestor RH" do seu seed
      nome: 'Gestor RH (Visitante)'
    },
    {
      email: 'servidor@sisvac.com',
      role: 'SERVIDOR',
      cpf: '111.111.111-11', // Liga com o "João Servidor" do seu seed
      nome: 'Servidor Comum (Visitante)'
    },
  ];

  for (const conta of contas) {
    const { error } = await supabase.auth.admin.createUser({
      email: conta.email,
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        nome: conta.nome,
        cpf: conta.cpf,
        role: conta.role
      }
    });

    if (error) {
      console.error(`❌ Erro ao criar login ${conta.email}:`, error.message);
    } else {
      console.log(`✅ Login criado: ${conta.email} | Perfil: ${conta.role}`);
    }
  }
}
async function run() {
  // 🧹 1º PASSO REAL: Limpar tudo antes de começar
  await wipeDatabase();

  // 0. Órgão
  console.log('\n0. Órgão...');
  const orgao = await ins('orgaos', { nome: 'Fundação Centro de Controle de Oncologia do Estado do Amazonas', sigla: 'FCECON' });

  if (!orgao?.id) {
    console.error('❌ Orgão falhou completamente - impossível continuar');
    return;
  }

  // 1. Cargos
  console.log('\n1. Cargos...');
  const cargo = await ins('cargos', { nome: 'Analista de Sistemas' });
  const cargoAdmin = await ins('cargos', { nome: 'Diretor de RH' });

  // 2. Setores
  console.log('\n2. Setores...');
  const setor = await ins('setores', { nome: 'Tecnologia da Informação', id_orgao: orgao.id });
  const setorAdmin = await ins('setores', { nome: 'Recursos Humanos', id_orgao: orgao.id });

  // 3. Funcionários
  console.log('\n3. Funcionários...');
  const func = await ins('funcionarios', { nome: 'João Servidor (Teste)', cpf: '111.111.111-11' });
  const funcAdmin = await ins('funcionarios', { nome: 'Gestor RH', cpf: '000.000.000-00' });

  if (!cargo?.id || !setor?.id || !func?.id) {
    console.error('\n❌ Dados essenciais faltando:', { cargo: cargo?.id, setor: setor?.id, func: func?.id });
    return;
  }

  // 4. Matrículas
  console.log('\n4. Matrículas...');
  const mat = await ins('matriculas', { id_funcionario: func.id, matricula: '20000-0', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2015-06-01', ativo: true });
  if (funcAdmin?.id && cargoAdmin?.id && setorAdmin?.id) {
    await ins('matriculas', { id_funcionario: funcAdmin.id, matricula: '10000-0', id_cargo: cargoAdmin.id, id_setor: setorAdmin.id, data_admissao: '2010-01-15', ativo: true });
  }

  if (!mat?.id) { console.error('\n❌ Matrícula falhou.'); return; }

  // 5. Exercícios (CORRIGIDO: Inserindo o ano_final obrigatório)
  console.log('\n5. Exercícios...');
  const ex24 = await ins('exercicios', { ano_inicial: 2024, ano_final: 2025 });
  const ex25 = await ins('exercicios', { ano_inicial: 2025, ano_final: 2026 });

  // 6. Saldos (CORRIGIDO: Removido avos_adquiridos que não existe no banco)
  console.log('\n6. Saldos de Férias...');
  if (ex24?.id) await ins('saldos_ferias', { id_matricula: mat.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0 });
  if (ex25?.id) await ins('saldos_ferias', { id_matricula: mat.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });

  // 👤 Criar Acesso do Visitante (O Trigger vai validar com o Gestor RH acima)
  await createVisitorLogin();

  // 7. Verificar
  console.log('\n7. Verificando View...');
  const { data: view } = await supabase.from('vw_servidores_busca').select('*').eq('cpf', '111.111.111-11');
  console.log(view?.length ? '✅ SERVIDOR ENCONTRADO NA VIEW!' : '❌ View vazia');
  if (view?.[0]) console.log(JSON.stringify(view[0], null, 2));

  console.log('\n🎉 Seed 100% completo!');
}

run();
