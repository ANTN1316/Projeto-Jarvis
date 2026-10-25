# Projeto Jarvis — Neural Interface

Aplicação React + Vite para a interface do J.A.R.V.I.S. O projeto inclui autenticação e preferências individuais com Supabase, além de uma integração inicial de chat com IA por Supabase Edge Function, mantendo o núcleo, os módulos e as visualizações da Fase 1.

## Tecnologias

- React 18 e Vite.
- Supabase Auth e PostgreSQL com Row Level Security (RLS).
- React Router para rotas públicas e privadas.
- As notas do Second Brain e os comandos de navegação continuam demonstrativos; não representam dados persistidos.

## Fase 1 preservada

- Núcleo SVG interativo com estados de espera, escuta simulada, processamento, resposta e conclusão.
- Console do Jarvis: atalhos de navegação continuam locais; mensagens livres usam a integração de IA quando a Edge Function estiver configurada.
- Navegação entre Core, Second Brain, System Log, Modules e Settings.
- Mapa SVG interativo com notas fictícias, conexões, zoom e reposicionamento por toque ou ponteiro.
- Registro de eventos limitado a 40 itens, preferências visuais e layout responsivo com suporte a movimento reduzido.

## Pré-requisitos e instalação

- Node.js 18 ou superior e npm.
- Um projeto Supabase próprio.

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Edite `.env.local` com os valores do seu projeto. O Vite precisa ser reiniciado após alterar variáveis de ambiente. `.env.local` é ignorado pelo Git.

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Obtenha a URL e publishable key na página de configurações de API do projeto Supabase. A aplicação também reconhece `VITE_SUPABASE_ANON_KEY` para projetos que ainda utilizam o nome legado. Essas chaves são públicas e ficam sujeitas a RLS; **nunca use `service_role` ou outra credencial privilegiada no navegador**. O arquivo `.env` é ignorado pelo Git.

## Configuração inicial do Supabase

1. Crie um projeto Supabase e copie a URL e publishable key para `.env.local`.
2. No SQL Editor do Supabase, execute [`supabase/migrations/202610190001_phase_2_auth_and_preferences.sql`](./supabase/migrations/202610190001_phase_2_auth_and_preferences.sql).
3. Em **Authentication → URL Configuration**, configure a URL local `http://localhost:5173/` como Site URL e inclua `http://localhost:5173/**` e `http://localhost:5173/reset-password` na lista de Redirect URLs. Em produção, adicione os endereços HTTPS reais e ajuste o Site URL; não permita domínios não confiáveis.
4. Em **Authentication → Providers → Email**, habilite o provedor de e-mail e configure confirmação de cadastro conforme o ambiente.
5. Configure o SMTP de produção em **Authentication → SMTP Settings**. O serviço padrão é apropriado somente para testes e pode ter limites de envio.

Cadastro e confirmação de e-mail retornam ao endereço raiz configurado. A recuperação redireciona para `/reset-password`. Os links funcionam somente se o domínio estiver permitido pelo Supabase e se o servidor de produção encaminhar rotas da aplicação para `index.html`.

## Executar

```bash
npm run dev
npm run build
npm run preview
```

## Fluxos implementados

- Cadastro com nome de exibição, e-mail, senha com pelo menos 8 caracteres, letra e número, e confirmação de senha.
- Login e encerramento de sessão pelo Supabase Auth.
- Restauração e renovação de sessão gerenciadas pelo cliente Supabase.
- Solicitação neutra de redefinição e atualização de senha em link válido de recuperação.
- Proteção da interface Jarvis, com retorno à rota solicitada após login.
- Perfil criado por trigger e preferências individuais inicializadas com os padrões da Fase 1.
- Atualização do nome e salvamento com debounce de preferências de apresentação na conta.

## Chat contextual e persistente (Fases 3.2 e 3.3)

As conversas e mensagens são salvas nas tabelas `chat_conversations` e `chat_messages`, criadas pela migration versionada em `supabase/migrations`. O navegador só cria mensagens do usuário; a Edge Function `jarvis-chat` valida a sessão, confirma que a conversa e a mensagem pertencem ao usuário autenticado e grava a resposta do assistente. O corpo enviado à Function contém apenas `conversationId` e `messageId`, não um `userId` fornecido pelo navegador. Respostas existentes são reutilizadas em reenvios, e índices únicos impedem mensagens repetidas para o mesmo identificador de requisição.

A Function consulta o histórico apenas da conversa validada e envia até as 20 mensagens mais recentes à OpenAI Responses API. Conversas e mensagens são restritas por RLS ao proprietário; a Function não recebe nem envia outras conversas do usuário. Conversas usam paginação por cursor e a interface carrega mensagens em páginas de 30. `store: false` é usado na chamada à OpenAI, mas o conteúdo continua sendo armazenado no Supabase e transmitido ao provedor para gerar respostas. Não envie informações sensíveis. A chave OpenAI nunca deve ser colocada em variáveis `VITE_*`, no código do frontend ou no repositório.

A Function exige Supabase Auth (`verify_jwt = true` e `auth: "user"`), limita mensagens a 4.000 caracteres, usa timeout e limita chamadas a 10 por minuto por instância. O limite em memória não é global. Respostas persistidas retornam `{ "message": { "id", "content", "created_at" } }`; erros retornam `{ "error": { "code": "...", "message": "..." } }`.

### Configurar e implantar

1. No Supabase Dashboard do projeto alvo, abra **Edge Functions → Secrets** e adicione `OPENAI_API_KEY` com a chave privada da OpenAI. Opcionalmente, defina `OPENAI_MODEL` com um modelo habilitado na sua conta. O código usa `gpt-4.1-mini` quando `OPENAI_MODEL` não está definido.
2. No painel OpenAI, habilite faturamento e configure limites de uso para controlar custos. O limite por minuto da Function é em memória por instância, não é um limitador global garantido; limites do provedor são uma proteção complementar.
3. Instale Docker se for usar o stack local; autentique o Supabase CLI e vincule o repositório ao projeto correto. A raiz `supabase/config.toml` habilita a Function e mantém `verify_jwt = true`.
4. Implante apenas a Function desejada:

```powershell
npx supabase functions deploy jarvis-chat --project-ref <PROJECT_REF>
```

Não use `--no-verify-jwt`. Não é necessário adicionar `@supabase/ssr` nem instalar SDK OpenAI no frontend; a Function usa o runtime Deno e chama a API HTTPS diretamente. Para desenvolvimento local, crie `supabase/functions/.env` com `OPENAI_API_KEY` e opcionalmente `OPENAI_MODEL`; esse caminho é ignorado pelo Git. O arquivo local de secrets não é o `.env.local` do Vite.

5. Reinicie `npm run dev`, entre com uma conta autenticada e crie uma conversa pelo console. Envie uma pergunta livre; comandos reconhecidos de navegação ainda alteram a tela localmente depois da resposta.
6. Se a chamada falhar, confira os logs da Edge Function no Dashboard e a resposta/status da requisição no navegador. A aplicação não registra mensagem, chave ou token nos logs da aplicação.

O rate limit em memória é uma proteção básica por instância: múltiplas instâncias podem aceitar mais chamadas do que esse limite. Antes de uso público, complemente-o com controle global por usuário (por exemplo, contador persistente/serviço de rate limiting) e limites de gasto no provedor.

### Implantar e validar a Fase 3.3 (migração não aplicada automaticamente)

1. No projeto Supabase correto, execute consultas somente leitura no SQL Editor para verificar se as tabelas e os nomes de policies/índices já existem. A inspeção remota não foi possível durante a implementação: o repositório não está vinculado a um projeto (`supabase migration list --linked` retorna `ProjectRefNotLinkedError`). A migration usa `CREATE TABLE` sem `IF NOT EXISTS` intencionalmente, para falhar em vez de mascarar uma tabela preexistente incompatível.

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('chat_conversations', 'chat_messages');

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('chat_conversations', 'chat_messages')
order by table_name, ordinal_position;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_conversations', 'chat_messages')
order by tablename, policyname;

select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('chat_conversations', 'chat_messages')
order by tablename, indexname;
```
2. Vincule o CLI ao projeto e compare todas as migrations locais e remotas:

```powershell
npx supabase link --project-ref <PROJECT_REF>
npx supabase migration list --linked
```

Se a migration da Fase 2 aparecer pendente, ou se a inspeção mostrar objetos homônimos não registrados, pare e reconcilie o schema/histórico antes de executar qualquer push. Não execute a migration duas vezes nem aplique `db push` sem confirmar o estado remoto.
3. Quando a migration da Fase 2 estiver reconciliada e o estado remoto corresponder ao schema local anterior, revise `supabase/migrations/20261024225438_add_persistent_chat.sql` e aplique as migrations pendentes pelo CLI. O `db push` pode aplicar todas as migrations locais pendentes, não apenas a Fase 3.3.
4. Implante a versão atualizada da Function com `npx supabase functions deploy jarvis-chat --project-ref <PROJECT_REF>` mantendo `verify_jwt = true` e configure `OPENAI_API_KEY`/`OPENAI_MODEL` nos secrets da Edge Function conforme os passos acima.
5. Execute `npx supabase test db` em uma stack local Supabase com Docker instalada para verificar o arquivo `supabase/tests/chat_rls.test.sql`. A suíte não foi executada durante esta implementação. No projeto remoto, teste com duas contas de teste: cada uma deve listar/abrir somente suas conversas, não conseguir criar mensagens na conversa da outra e não conseguir forjar mensagens do assistente.
6. Na interface, crie uma conversa, envie pelo menos três mensagens, reabra-a, atualize a página, carregue mensagens antigas e tente novamente uma mensagem sem resposta. Confirme que a ordem se mantém e que somente uma resposta é exibida por mensagem. Teste também desconexão de rede, mensagem vazia e limite de 4.000 caracteres.

## Modelo e segurança RLS

A migração cria:

- `profiles`: um perfil por `auth.users.id`; um trigger cria o registro com nome de exibição durante o cadastro. Usuários autenticados podem selecionar e atualizar somente o próprio perfil. Não há política de inserção direta; a identidade não pode ser atualizada pelo cliente.
- `user_preferences`: uma linha única por usuário, com tema, cor de destaque, idioma, opções futuras de voz/sons e as opções atuais de apresentação. Usuários podem consultar, inserir e atualizar somente a linha cujo `user_id` corresponda a `auth.uid()`.
- `chat_conversations` e `chat_messages`: conversas e mensagens vinculadas ao usuário por chaves estrangeiras compostas, com RLS de proprietário, inserção de mensagens do usuário pelo navegador e respostas do assistente gravadas pela Function após validação. Respostas possuem vínculo único à mensagem que as originou.
- Triggers existentes que atualizam `updated_at`, restrições para valores de apresentação e grants explícitos limitados às colunas necessárias.

RLS é a barreira de autorização dos dados; a proteção de rotas no React é somente uma regra de navegação. As novas tabelas do chat não concedem acesso a `anon`; usuários só podem excluir suas próprias conversas e mensagens. As tabelas de perfil e preferências continuam sem política de exclusão pelo cliente. Credenciais administrativas são usadas somente pelo runtime da Edge Function para inserir uma resposta já vinculada ao usuário validado, nunca no cliente.

## Testes e limitações

Não existe um runner de testes frontend configurado. A migração adiciona o teste pgTAP `supabase/tests/chat_rls.test.sql`, mas ele precisa ser executado em uma stack Supabase local com Docker. A build (`npm run build`) não substitui esse teste nem os fluxos manuais de integração; não considere o isolamento entre contas validado até ambos serem executados.

Para verificar isolamento, crie duas contas de teste distintas e tente ler/alterar pelo cliente Supabase o perfil e as preferências da outra conta, inserir uma preferência usando o `user_id` alheio e executar operações sem sessão. RLS deve bloquear os acessos cruzados. Não use usuários reais nem credenciais privilegiadas nesses testes.

As notas do grafo, histórico de eventos e estados do reator continuam locais e demonstrativos. Perfil, preferências e conversas do chat são persistidos no PostgreSQL. Ainda não existe memória inteligente para o Second Brain, execução de ferramentas pelo modelo, comandos personalizáveis ou integração de voz.

## Publicação futura

Configure as duas variáveis públicas no provedor de hospedagem, aplique a migração no projeto Supabase de produção, configure os domínios de autenticação e SMTP, habilite fallback de rotas SPA para `index.html` e publique somente em HTTPS. Revise políticas RLS e limites de autenticação antes de disponibilizar a aplicação. Nunca copie segredos administrativos para variáveis `VITE_*`.

## Checklist da Fase 2

- [x] Preservar a interface e os módulos demonstrativos da Fase 1.
- [x] Preparar cadastro, login, logout e recuperação com Supabase Auth.
- [x] Proteger a aplicação e restaurar a sessão no cliente.
- [x] Criar migração de perfil, preferências e políticas RLS.
- [x] Adicionar configuração de ambiente sem credenciais reais.
- [x] Conectar preferências visuais e nome de exibição à conta.
- [x] Documentar configuração do Supabase e URLs de Auth.
- [x] Adicionar integração inicial de IA autenticada via Edge Function, sem persistência de conversa ou execução de ferramentas.
- [ ] Configurar credenciais reais, executar migração e testar Auth/e-mail no Supabase.
- [ ] Executar testes reais de isolamento entre usuários.
- [ ] Adicionar testes automatizados quando a infraestrutura de testes for definida.
- [ ] Configurar o segredo OpenAI, implantar a Edge Function e validar chamada real em ambiente autenticado.
