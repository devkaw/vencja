-- Verificação de segurança do banco real. Só leitura: não altera nada.
-- Rode no SQL Editor do Supabase depois da migração 20261106_dashboard_completo.sql.

-- 1. Toda tabela pública precisa de rls = true.
select c.relname as tabela, c.relrowsecurity as rls,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by rls, tabela;

-- 2. Políticas abertas: "true" para anon/authenticated é problema. Deve voltar vazio.
select tablename, policyname, cmd, roles::text
from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') = 'true' or coalesce(with_check, '') = 'true');

-- 3. O que anon e authenticated podem fazer. anon não deve aparecer em tabelas de dados.
select grantee, table_name, string_agg(privilege_type, ', ') as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by 1, 2
order by 2, 1;

-- 4. Colunas de perfil: o que não for usado pode sair (minimização). cpf e phone não são usados pelo app.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- 5. Gatilhos de limite do plano e função de limite de tentativas instalados.
select tgname, tgrelid::regclass as tabela from pg_trigger where tgname in ('clients_plan_limit', 'charges_plan_limit');
select proname from pg_proc where proname in ('enforce_plan_limits', 'consumir_limite');

-- 6. Buckets públicos. Deve voltar vazio.
select id, public from storage.buckets where public = true;
