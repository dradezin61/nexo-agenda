-- A conta de teste pública tinha papel de gestor, e a gestão lê os perfis e as
-- reservas de todos os cadastrados (políticas "perfil próprio ou gestão" e
-- "reservas próprias ou gestão", em 0001_schema.sql). Quem entrasse pelo botão
-- público via os dados de usuários reais e podia cancelar as aulas deles.
--
-- Aqui o papel é revogado no banco, o que também derruba o acesso de sessões já
-- abertas: o papel é lido do perfil a cada requisição. O botão público
-- correspondente saiu da interface.
--
-- A gestão do estúdio passa a depender de uma conta própria, promovida fora do
-- versionamento (o e-mail não fica no repositório):
--   npm run db:gestor -- <e-mail>
update public.profiles p
set role = 'student'
from auth.users u
where u.id = p.id
  and u.email = 'gestor.demo@example.com'
  and p.role = 'manager';
