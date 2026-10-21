# Projeto Jarvis — Neural Interface

Aplicação React + Vite para a interface do J.A.R.V.I.S. A Fase 2 adiciona autenticação real e persistência individual com Supabase, mantendo o núcleo, os módulos e as visualizações demonstrativas da Fase 1.

## Tecnologias

- React 18 e Vite.
- Supabase Auth e PostgreSQL com Row Level Security (RLS).
- React Router para rotas públicas e privadas.
- As notas do Second Brain e os comandos do núcleo continuam sendo demonstrações locais; não representam dados persistidos nem integrações reais.

## Fase 1 preservada

- Núcleo SVG interativo com estados de espera, escuta simulada, processamento, resposta e conclusão.
- Console local com respostas determinísticas para comandos demonstrativos; outros comandos são identificados como não implementados.
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

1. Crie um projeto Supabase e copie a URL e publishable key para `.env`.
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

## Modelo e segurança RLS

A migração cria:

- `profiles`: um perfil por `auth.users.id`; um trigger cria o registro com nome de exibição durante o cadastro. Usuários autenticados podem selecionar e atualizar somente o próprio perfil. Não há política de inserção direta; a identidade não pode ser atualizada pelo cliente.
- `user_preferences`: uma linha única por usuário, com tema, cor de destaque, idioma, opções futuras de voz/sons e as opções atuais de apresentação. Usuários podem consultar, inserir e atualizar somente a linha cujo `user_id` corresponda a `auth.uid()`.
- Triggers que atualizam `updated_at`, restrições para valores de apresentação e grants explícitos limitados às colunas necessárias.

RLS é a barreira de autorização dos dados; a proteção de rotas no React é somente uma regra de navegação. O SQL não concede acesso a `anon`, não oferece exclusão de registros pessoais e não usa credenciais administrativas no cliente. O trigger `SECURITY DEFINER` serve exclusivamente para criar o perfil no cadastro e fixa `search_path` vazio.

## Testes e limitações

O repositório ainda não possui infraestrutura de testes automatizados. A verificação executada nesta etapa é a build de produção (`npm run build`); ela não substitui testes de integração. Os fluxos de Auth, envio de e-mail, persistência e isolamento entre duas contas dependem de um projeto Supabase, credenciais, aplicação da migração e configuração de e-mail. **Esses cenários não devem ser considerados validados até serem executados nesse ambiente.**

Para verificar isolamento, crie duas contas de teste distintas e tente ler/alterar pelo cliente Supabase o perfil e as preferências da outra conta, inserir uma preferência usando o `user_id` alheio e executar operações sem sessão. RLS deve bloquear os acessos cruzados. Não use usuários reais nem credenciais privilegiadas nesses testes.

As notas do grafo, comandos do assistente, histórico de eventos e estados do reator continuam locais e demonstrativos nesta fase. Somente perfil e preferências de conta são persistidos no PostgreSQL. Ainda não existe backend próprio, memória inteligente, execução de comandos externos ou integração de voz.

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
- [ ] Configurar credenciais reais, executar migração e testar Auth/e-mail no Supabase.
- [ ] Executar testes reais de isolamento entre usuários.
- [ ] Adicionar testes automatizados quando a infraestrutura de testes for definida.
