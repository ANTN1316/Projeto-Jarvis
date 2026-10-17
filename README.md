# Projeto Jarvis — Neural Interface

Interface local de demonstração para o J.A.R.V.I.S., construída com React e Vite. A Fase 1 concentra-se na experiência visual e na navegação: não implementa autenticação, backend, integração externa, IA remota nem captura de voz.

## Executar

Requisitos: Node.js 18 ou superior e npm.

```bash
npm install
npm run dev
```

Para gerar e pré-visualizar a build de produção:

```bash
npm run build
npm run preview
```

## Funcionalidades da Fase 1

- Núcleo SVG interativo com estados de espera, escuta simulada, processamento, resposta e conclusão.
- Console local com respostas determinísticas para os comandos demonstrativos: “Olá, Jarvis.”, “Status do sistema.”, “Abrir Second Brain.”, “Mostrar módulos.”, “Abrir configurações.” e “Voltar ao núcleo.” Outros comandos são identificados como não implementados.
- Navegação entre Core, Second Brain, System Log, Modules e Settings.
- Mapa SVG explorável com notas fictícias, seleção, conexões, zoom e reposicionamento por toque ou ponteiro.
- Registro limitado a 40 eventos locais e preferências visuais persistidas no `localStorage`.
- Layout adaptável, navegação por teclado, foco visível e suporte a movimento reduzido.

O relógio e os estados apresentados descrevem a interface local. Rede, microfone, módulos futuros e serviços de backend não são conectados nem apresentados como ativos.
