import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Tenta pegar as variáveis direto do ambiente (que vêm das Secrets do GitHub Actions)
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 2. Se NÃO achou no ambiente (ou seja, você está rodando localmente no seu PC), lê do arquivo .env.local
if (!supabaseUrl || !supabaseKey) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      if (line.includes('=')) {
        const [key, ...vals] = line.split('=');
        const value = vals.join('=').trim().replace(/['"]/g, '');
        if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value;
        if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = value;
      }
    });
  } catch (err) {
    console.log('Aviso: .env.local não encontrado, tentando prosseguir...');
  }
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ FALTAM AS CHAVES DO SUPABASE! Configure as Secrets no GitHub ou o .env.local no PC.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  // Definindo as contas alinhadas perfeitamente com a tabela de funcionários
  const contas = [
    {
      email: 'rh@sisvac.com',
      role: 'RH',
      cpf: '000.000.000-00',
      nome: 'Gestor RH' // <-- Alinhado com a linha de criação do RH
    },
    {
      email: 'servidor@sisvac.com',
      role: 'SERVIDOR',
      cpf: '111.111.111-11',
      nome: 'João Servidor (Teste)' // <-- Alinhado com a linha de criação do João
    },
  ];

  for (const conta of contas) {
    const { error } = await supabase.auth.admin.createUser({
      email: conta.email,
      password: 'sisvac123',
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

  // Novos funcionários para popular o dashboard
  const f1 = await ins('funcionarios', { nome: 'Ana L. Guerreiro', cpf: '222.222.222-22' });
  const f2 = await ins('funcionarios', { nome: 'Fatima K. Oliveira', cpf: '333.333.333-33' });
  const f3 = await ins('funcionarios', { nome: 'Carlos M. Pinheiro', cpf: '444.444.444-44' });
  const f4 = await ins('funcionarios', { nome: 'Mariana Silva Sousa', cpf: '555.555.555-55' });
  const f5 = await ins('funcionarios', { nome: 'Roberto Alves', cpf: '666.666.666-66' });

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

  const m1 = await ins('matriculas', { id_funcionario: f1.id, matricula: '1032755A', id_cargo: cargo.id, id_setor: setorAdmin.id, data_admissao: '2018-03-10', ativo: true });
  const m2 = await ins('matriculas', { id_funcionario: f2.id, matricula: '0026271A', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2019-07-22', ativo: true });
  const m3 = await ins('matriculas', { id_funcionario: f3.id, matricula: '0071244E', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2020-11-05', ativo: true });
  const m4 = await ins('matriculas', { id_funcionario: f4.id, matricula: '0081234F', id_cargo: cargo.id, id_setor: setorAdmin.id, data_admissao: '2021-02-14', ativo: true });
  const m5 = await ins('matriculas', { id_funcionario: f5.id, matricula: '0091234G', id_cargo: cargo.id, id_setor: setor.id, data_admissao: '2022-09-01', ativo: true });

  if (!mat?.id) { console.error('\n❌ Matrícula falhou.'); return; }

  // 5. Exercícios
  console.log('\n5. Exercícios...');
  const ex23 = await ins('exercicios', { ano_inicial: 2023, ano_final: 2024 });
  const ex24 = await ins('exercicios', { ano_inicial: 2024, ano_final: 2025 });
  const ex25 = await ins('exercicios', { ano_inicial: 2025, ano_final: 2026 });
  const ex26 = await ins('exercicios', { ano_inicial: 2026, ano_final: 2027 }); // <- Exercício de 2026!

  // 6. Saldos de Férias
  console.log('\n6. Saldos de Férias...');
  if (ex24?.id) await ins('saldos_ferias', { id_matricula: mat.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0 });
  if (ex25?.id) await ins('saldos_ferias', { id_matricula: mat.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
  if (ex26?.id) await ins('saldos_ferias', { id_matricula: mat.id, id_exercicio: ex26.id, dias_direito: 30, dias_utilizados: 0 }); // <- Saldo de 2026 para o João!

  // Saldos para os novos funcionários (gerando risco para Ana, Fatima, Carlos)
  if (ex23?.id) {
    await ins('saldos_ferias', { id_matricula: m1.id, id_exercicio: ex23.id, dias_direito: 30, dias_utilizados: 0 }); // Ana
    await ins('saldos_ferias', { id_matricula: m2.id, id_exercicio: ex23.id, dias_direito: 30, dias_utilizados: 0 }); // Fatima
  }
  if (ex24?.id) {
    await ins('saldos_ferias', { id_matricula: m1.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m2.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m3.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m4.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 10 });
    await ins('saldos_ferias', { id_matricula: m5.id, id_exercicio: ex24.id, dias_direito: 30, dias_utilizados: 30 });
  }
  if (ex25?.id) {
    await ins('saldos_ferias', { id_matricula: m1.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m2.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m3.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m4.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
    await ins('saldos_ferias', { id_matricula: m5.id, id_exercicio: ex25.id, dias_direito: 30, dias_utilizados: 0 });
  }

  console.log('\n7. Criando Solicitações de Férias para o Dashboard...');

  // PENDENTE
  await ins('solicitacoes', {
    id_matricula: m1.id, tipo_afastamento: 'FERIAS_INTEGRAL', tipo_fracionamento: 'INTEGRAL', dias_solicitados: 30,
    data_inicio: '2026-10-01', data_fim: '2026-10-30', exercicio: '2024/2025', status: 'PENDENTE'
  });

  // EM_ANALISE
  await ins('solicitacoes', {
    id_matricula: m2.id, tipo_afastamento: 'FERIAS_FRACIONADA', tipo_fracionamento: 'QUINZE_QUINZE', dias_solicitados: 15,
    data_inicio: '2026-11-01', data_fim: '2026-11-15', exercicio: '2024/2025', status: 'EM_ANALISE'
  });

  // APROVADO
  await ins('solicitacoes', {
    id_matricula: m3.id, tipo_afastamento: 'FERIAS_INTEGRAL', tipo_fracionamento: 'INTEGRAL', dias_solicitados: 30,
    data_inicio: '2026-12-01', data_fim: '2026-12-30', exercicio: '2024/2025', status: 'APROVADO'
  });

  const hojeStr = new Date().toISOString().split('T')[0];
  const trintaDiasFrente = new Date();
  trintaDiasFrente.setDate(trintaDiasFrente.getDate() + 30);
  const fimStr = trintaDiasFrente.toISOString().split('T')[0];

  // EM_GOZO (em descanso hoje)
  await ins('solicitacoes', {
    id_matricula: m4.id, tipo_afastamento: 'FERIAS_INTEGRAL', tipo_fracionamento: 'INTEGRAL', dias_solicitados: 30,
    data_inicio: hojeStr, data_fim: fimStr, exercicio: '2024/2025', status: 'EM_GOZO'
  });

  // NEGADO
  await ins('solicitacoes', {
    id_matricula: m5.id, tipo_afastamento: 'LICENCA_ESPECIAL', tipo_fracionamento: 'INTEGRAL', dias_solicitados: 90,
    data_inicio: '2026-08-01', data_fim: '2026-10-29', exercicio: '2024/2025', status: 'NEGADO',
    justificativa_negacao: 'Falta de efetivo no setor.'
  });

  // 👤 Criar Acesso do Visitante (O Trigger vai validar com o João Servidor e o Gestor RH acima)
  await createVisitorLogin();

  // 7. Verificar
  console.log('\n8. Verificando View...');
  const { data: view } = await supabase.from('vw_servidores_busca').select('*').eq('cpf', '111.111.111-11');
  console.log(view?.length ? '✅ SERVIDOR ENCONTRADO NA VIEW!' : '❌ View vazia');
  if (view?.[0]) console.log(JSON.stringify(view[0], null, 2));

  console.log('\n🎉 Seed 100% completo!');
}

run();