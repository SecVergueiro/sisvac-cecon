-- ESTE SCRIPT APAGA ABSOLUTAMENTE TUDO NO BANCO DE DADOS
-- ELE UTILIZA OS NOMES CORRETOS DAS TABELAS ATUAIS DO SISTEMA:

TRUNCATE TABLE 
  solicitacoes, 
  saldos_ferias, 
  exercicios, 
  feriados, 
  matriculas, 
  funcionarios, 
  cargos, 
  setores, 
  profiles 
CASCADE;

-- Caso as tabelas antigas ainda existam na sua base, apague-as também:
-- TRUNCATE TABLE aprovacoes_ferias, solicitacoes_ferias CASCADE;
