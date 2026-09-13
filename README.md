```
╭──────────────────────────────────────────────────────────────────────────╮
│ ● ● ●                 claude code · dracula black                        │
├──────────────────────────────────────────────────────────────────────────┤
│              .                                          ·                │
│  ·                                                                .      │
│                   ·                                          *           │
│        *                  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                          │
│                       ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                   ·  │
│                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                   │
│    .             ░░░░░░░████████████████████████░░░░░░░░   +        ╻    │
│    ╻      +             ████████████████████████                    ▓    │
│    ▓          ░░░░░░░░░░██                    ██░░░░░░░░░░░         ▓    │
│    ▓        ░░░░░░░░░░░░██      ████████      ██░░░░░░░░░░░░░       ▓ ╻  │
│ ╻  ▓                ████████  ████████████  ████████                ▓ ▓▓ │
│ ▓▓ ▓      ░░░░░░░░░░████████████████████████████████░░░░░░░░░░░  ╻  ▓ ▓▓ │
│ ▓▓ ▓ ╻                  ████████████████████████                 ▓▓ ▓ ▓▓ │
│ ▓▓ ▓ ▓▓                 ████████████████████████                 ▓▓ ▓ ▓▓ │
│ ▓▓ ▓ ▓▓  ░░░░░░░░░░░░░░░░░██░░██░░░░░░░░██░░██░░░░░░░░░░░░░░░░░░ ▓▓ ▓ ▓▓ │
│ ▓▓ ▓ ▓▓                   ██  ██        ██  ██                   ▓▓ ▓ ▓▓ │
│══════════════════════════════════════════════════════════════════════════│
│   ╱     ╱     ╱    ╱     ╱    ╱     │     ╲    ╲     ╲    ╲     ╲     ╲  │
│──────────────────────────────────────────────────────────────────────────│
│     ╱         ╱          ╱          │          ╲          ╲         ╲    │
│          ╱             ╱            │            ╲             ╲         │
│──────────────────────────────────────────────────────────────────────────│
│╱                 ╱                  │                  ╲                 │
╰──────────────────────────────────────────────────────────────────────────╯
```

<h1 align="center">Claude Code · Dracula Black</h1>

<p align="center">
  <b>Um visual escuro, detalhado e acessível para o Claude Code no Windows Terminal.</b><br>
  Status line cheia de dados, bonequinho no canto, jingle do Zelda quando a tarefa termina e tema Dracula com fundo preto.
</p>

<p align="center">
  <img alt="Claude Code 2.1.270" src="https://img.shields.io/badge/Claude_Code-2.1.270-D77757?style=for-the-badge&logo=claude&logoColor=white">
  <img alt="Windows Terminal 1.24" src="https://img.shields.io/badge/Windows_Terminal-1.24-44475A?style=for-the-badge&logo=windowsterminal&logoColor=white">
  <img alt="Node.js 18.15 ou mais novo" src="https://img.shields.io/badge/Node.js-18.15%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img alt="Tema Dracula Black" src="https://img.shields.io/badge/tema-Dracula_Black-282A36?style=for-the-badge&logo=dracula&logoColor=BD93F9">
  <img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-BD93F9?style=for-the-badge">
</p>

<p align="center">
  <a href="#instalação">Instalação</a> ·
  <a href="#status-line">Status line</a> ·
  <a href="#toque-de-tarefa-concluída">Toque</a> ·
  <a href="#personalização">Personalização</a> ·
  <a href="#como-funciona">Como funciona</a>
</p>

---

## Sumário

- [Destaques](#destaques)
- [Prévia](#prévia)
- [Status line](#status-line)
- [Linha dos subagentes](#linha-dos-subagentes)
- [Tema do Claude Code](#tema-do-claude-code)
- [Windows Terminal](#windows-terminal)
- [Spinner em português](#spinner-em-português)
- [Toque de tarefa concluída](#toque-de-tarefa-concluída)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Personalização](#personalização)
- [Como funciona](#como-funciona)
- [Testes](#testes)
- [Solução de problemas](#solução-de-problemas)
- [Créditos](#créditos)
- [Licença](#licença)

## Destaques

| | |
|---|---|
| 📊 **Status line descritiva** | Sessão, modelo, git, PR, contexto, limites de uso, cache, tokens, custo, CPU, GPU, RAM, discos e bateria, com rótulos em português. |
| 📐 **Ajuste à largura** | Os dados se distribuem em quantas linhas couberem no terminal: 3 em tela larga, mais em tela estreita. |
| 🦀 **Bonequinho do Claude Code** | O mesmo desenho da tela de abertura, fixo no canto inferior direito da barra. |
| 🤖 **Linha dos subagentes** | Cada agente em paralelo aparece com status, modelo, uso de tokens, tempo e tarefa. |
| 🧛 **Tema Dracula Black** | Interface do Claude em roxo, ciano e rosa sobre fundo preto, com base no tema para daltonismo. |
| 🪟 **Windows Terminal** | Fundo preto translúcido, abas pretas, Cascadia Code, linhas mais espaçadas, perfil "Claude Code" e modo Quake. |
| 🔔 **Toque de tarefa concluída** | Notificação do Windows com resumo e o *Secret Sound* de The Legend of Zelda quando uma tarefa longa termina. |
| ⏳ **Spinner em português** | "Tramando", "Garimpando", "Destrinchando"… no lugar dos verbos em inglês. |
| ♿ **Acessível** | Níveis vão de ciano para amarelo e laranja (nunca de verde para vermelho), e todo estado vem acompanhado de texto. |

## Prévia

```
sessão meu-projeto │ modelo Opus · esforço xhigh │ pasta claude-code-dracula-black │ repo gblsun/claude-code-dracula-black │ branch main · 3 alterados │ último commit há 44m                                   ▐▛███▜▌
contexto ███░░░░░░░ 32% · 64k de 200k │ limite 5h 24% · renova em 2h12m │ limite semanal 41% · renova em 3d03h │ cache ● ativo · expira em 42m · acerto 91% │ custo $1,23 · $1,14/h │ dom 13/09 03:25          ▝▜█████▛▘
duração 1h05m │ linhas +156 -23 · 165/h │ cpu 36% · gpu 25% · ram 10,5/15,8 GB 67% · 2400 MHz │ discos C: 15/118 GB livres · D: 865/932 GB livres │ bateria 16% na tomada │ claude v2.1.270                      ▘▘ ▝▝
```

Um dado só aparece quando existe: git só dentro de um repositório, PR só com um pull request aberto, limites só em assinaturas Pro e Max.

## Status line

### Sessão e projeto

| Dado | Significado |
|---|---|
| `sessão` | Nome da sessão, definido com `/rename` ou gerado automaticamente |
| `modelo` · `esforço` | Modelo que responde e nível de raciocínio (`low` a `max`) |
| `fast mode` · `vim` · `agente` | Modos ativos no momento |
| `pasta` | Pasta onde o Claude está trabalhando |
| `repo` | Repositório remoto (`dono/projeto`), clicável com Ctrl+clique |
| `branch` · `alterados` | Branch atual e quantos arquivos têm alterações não commitadas |
| `↑ p/ enviar` · `↓ p/ baixar` | Commits ainda não enviados (`git push`) e commits do remoto ainda não baixados (`git pull`) |
| `stash` · `último commit` | Alterações guardadas com `git stash` e tempo desde o último commit |
| `PR` | Pull request aberto e o estado da revisão: aprovado, pendente, alterações pedidas ou rascunho |
| `projeto` · `node` / `python` | Nome e versão do `package.json` e a versão do runtime do projeto |

### Consumo

| Dado | Significado |
|---|---|
| `contexto` | Quanto da memória da conversa está ocupado, em porcentagem e em tokens. Perto de 100%, o Claude resume a conversa |
| `limite 5h` · `limite semanal` | Uso dos limites da assinatura e quanto falta para renovarem |
| `cache` | Se o cache está ativo (a próxima mensagem sai mais rápida e barata), quando expira e a taxa de acerto |
| `tokens da sessão` | Total de tokens processados (entrada) e gerados (saída) desde o início da sessão |
| `custo` | Custo estimado em dólar e média por hora. Na assinatura é só uma referência |

### Tempo e computador

| Dado | Significado |
|---|---|
| data e hora · `duração` | Relógio e há quanto tempo a sessão está aberta |
| `linhas` | Linhas adicionadas e removidas pelo Claude, e a média por hora |
| `cpu` · `gpu` | Uso do processador e da placa de vídeo mais ocupada |
| `ram` · `MHz` | Memória usada/total em GB, porcentagem e a velocidade em que a RAM está rodando |
| `discos` | Espaço livre e total de cada disco local (C:, D:…) |
| `bateria` | Carga e se o notebook está na tomada ou carregando |
| `claude` | Versão do Claude Code |

### Cores

| Cor | Quando aparece |
|---|---|
| Ciano | Nível tranquilo (abaixo de 50%), cache ativo, PR aprovado, linhas adicionadas |
| Amarelo | Atenção (50–79%), commits para baixar, PR pendente |
| Laranja | Perto do limite (80% ou mais), arquivos alterados, alterações pedidas, disco ou bateria baixos |
| Lavanda | Rótulos de cada dado |
| Cinza-azulado | Separadores e a parte vazia das barras |

### Bonequinho

O bonequinho do Claude Code fica alinhado à direita das últimas 3 linhas da barra, em laranja:

```
 ▐▛███▜▌
▝▜█████▛▘
  ▘▘ ▝▝
```

Os dados usam a largura que sobra ao lado dele. Em terminais com menos de ~74 colunas ele some, para não apertar nada.

## Linha dos subagentes

Quando o Claude roda agentes em paralelo, cada um ganha uma linha própria no painel abaixo da caixa de digitação:

```
● revisor · sonnet-5 high · █░░░░ 42k tok · 1m · Revisando o módulo de autenticação…
● explorador · haiku-4-5 · 1,2M tok · 5s
```

| Parte | Significado |
|---|---|
| `●` | Status: ciano rodando, cinza terminado, laranja com erro |
| nome | Nome do agente |
| modelo · esforço | Modelo usado (sem o prefixo `claude-`) e nível de esforço |
| `█░░░░ 42k tok` | Quanto da memória do agente já foi usado |
| tempo | Há quanto tempo o agente está rodando |
| descrição | O que o agente está fazendo, cortado para caber na largura |

## Tema do Claude Code

O tema **Dracula Black** (`claude/themes/dracula.json`) parte do `dark-daltonized` e troca só as cores de destaque:

- roxo no spinner e no destaque principal;
- ciano no plan mode e nas sugestões;
- rosa nas caixas de permissão;
- fundos quase pretos atrás das suas mensagens, dos comandos `!` e da seleção.

As cores de sucesso, erro, aviso e diff continuam as do tema para daltonismo.

Para ajustar com preview ao vivo: `/theme`, selecione **Dracula Black** e aperte `Ctrl+E`.

## Windows Terminal

O trecho `windows-terminal/dracula-black.json` configura:

| Item | Configuração |
|---|---|
| Esquema de cores | **Dracula Black**: fundo `#000000`, texto `#F8F8F2` e cursor roxo |
| Tema da janela | Barra de abas e título pretos; a aba ativa fica em cinza bem escuro |
| Transparência | `opacity: 25` com desfoque acrílico (`useAcrylic`) |
| Fonte | Cascadia Code, com linhas 1,2× mais altas (`cellHeight`) |
| Espaçamento | Margem de 24 px embaixo (`padding: "8, 8, 8, 24"`) |
| Cursor | Formato de barra |
| Perfil "Claude Code" | Abre direto no Claude, com ícone ✳️, aba roxa e título fixo "Claude" |
| Modo Quake | `Win` + tecla à esquerda do `1` faz o terminal descer do topo da tela |

## Spinner em português

Enquanto o Claude trabalha, o spinner mostra verbos em português: *Pensando, Tramando, Cozinhando, Matutando, Arquitetando, Garimpando, Lapidando, Destrinchando, Maquinando, Rabiscando, Conjurando, Fuçando, Costurando, Afinando e Decifrando*.

Junto das dicas padrão, entram 5 dicas em português:
- atalho para quebrar linha;
- como editar o tema;
- como trocar o modo de permissão;
- como voltar a uma mensagem anterior;
- como rodar comandos com `!`.

## Toque de tarefa concluída

<p align="center">
  <img src="https://media.giphy.com/media/NVBR6cLvUjV9C/giphy.gif" alt="Link, de The Legend of Zelda, de óculos escuros" width="240">
</p>

Quando uma resposta do Claude leva **15 segundos ou mais**, o hook `Stop`:

1. mostra uma notificação do Windows, em nome do Windows Terminal (clicar nela abre o terminal), com:
   - título `✓ Tarefa concluída · <pasta do projeto>`;
   - a primeira linha da resposta final como resumo;
   - quanto tempo a tarefa levou;
2. toca o **Secret Sound** de The Legend of Zelda, o jingle de "segredo encontrado", em volume baixo.

**[🔊 Ouvir o toque](claude/sons/tarefa-concluida.wav)**. O GitHub não toca áudio dentro do README, então o link abre o arquivo para baixar.

Respostas rápidas não disparam nada, para não virar ruído. O hook roda em segundo plano (`async`) e não atrasa o Claude.

> The Legend of Zelda é marca da Nintendo. O toque é uma recriação feita por síntese de notas, sem áudio extraído do jogo, e este projeto não tem ligação com a Nintendo.

## Estrutura do repositório

```
claude-code-dracula-black/
├── claude/                        → arquivos que vão para ~/.claude
│   ├── statusline.mjs             → status line principal
│   ├── subagent-statusline.mjs    → linha de cada subagente
│   ├── palette.mjs                → paleta Dracula e utilitários compartilhados
│   ├── statusline-windows.js      → coletor de bateria, RAM, discos e GPU (WMI)
│   ├── tarefa-concluida.ps1       → toque de tarefa concluída (hook Stop)
│   ├── settings.example.json      → trecho do settings.json do Claude Code
│   ├── themes/
│   │   └── dracula.json           → tema Dracula Black
│   └── sons/
│       ├── tarefa-concluida.wav   → Secret Sound do Zelda, recriado por síntese
│       ├── gerar-toque-zelda.mjs  → gera o .wav do jingle
│       └── gerar-toque.mjs        → alternativa: arpejo de sino original
├── windows-terminal/
│   └── dracula-black.json         → trecho do settings.json do Windows Terminal
├── test/
│   └── statusline.test.mjs        → testes com dados simulados
├── LICENSE
└── README.md
```

## Requisitos

| Requisito | Versão |
|---|---|
| Claude Code | recente (testado na 2.1.270) |
| Node.js | 18.15 ou mais novo |
| Git | 2.35 ou mais novo, para contar o stash |
| Windows Terminal | 1.21 ou mais novo, para o espaçamento entre linhas (testado na 1.24) |
| Windows | necessário para bateria, GPU, todos os discos, velocidade da RAM e o toque, que usam `cscript` e Windows PowerShell 5.1. Nos outros sistemas, a barra mostra só o disco da pasta atual |

## Instalação

**1. Clone o repositório e copie os arquivos para `~/.claude`** (PowerShell):

```powershell
git clone https://github.com/gblsun/claude-code-dracula-black.git
cd claude-code-dracula-black
New-Item -ItemType Directory -Force "$HOME\.claude\themes", "$HOME\.claude\sons" | Out-Null
Copy-Item claude\*.mjs, claude\statusline-windows.js, claude\tarefa-concluida.ps1 "$HOME\.claude\"
Copy-Item claude\themes\dracula.json "$HOME\.claude\themes\"
Copy-Item claude\sons\* "$HOME\.claude\sons\"
```

**2. Configure o Claude Code.** Mescle o conteúdo de `claude/settings.example.json` no seu `~/.claude/settings.json`. No hook `Stop`, troque `SEU_USUARIO` pelo nome da sua pasta de usuário do Windows.

**3. Configure o Windows Terminal.** Abra as configurações em JSON (`Ctrl+Shift+,`) e mescle o conteúdo de `windows-terminal/dracula-black.json`:

- `schemes`, `themes` e `theme`: fundo e barra de abas pretos;
- `profiles.defaults`: transparência, fonte, espaçamento e cursor;
- o perfil **Claude Code** (opcional). Se quiser, gere um GUID novo com `[guid]::NewGuid()`;
- o atalho do **modo Quake** em `keybindings` (opcional).

**4. Reinicie o Claude Code.**

## Personalização

| Quero mudar… | Onde |
|---|---|
| Cores da barra | Constantes em `palette.mjs` |
| Cores da interface | `/theme` → **Dracula Black** → `Ctrl+E` |
| Ordem ou quais dados aparecem | Cada dado é um bloco em `statusline.mjs`, na ordem em que aparece |
| Cor do bonequinho | `MASCOT_COLOR` em `statusline.mjs` |
| Frequência de atualização da barra | `refreshInterval` no `statusLine` do `settings.json` |
| Transparência do terminal | `opacity` no Windows Terminal (0 a 100) |
| Verbos e dicas do spinner | `spinnerVerbs` e `spinnerTipsOverride` no `settings.json` |
| Tempo mínimo para o toque | Adicione `"-SegundosMinimos", "30"` ao fim de `args` no hook `Stop` |
| Volume do jingle | `VOLUME` em `sons/gerar-toque-zelda.mjs`, depois `node sons/gerar-toque-zelda.mjs` |
| Som original no lugar do jingle | `node sons/gerar-toque.mjs`, ou qualquer `.wav` chamado `tarefa-concluida.wav` |
| Nome da sessão na caixa de digitação | `/rename ""` apaga o nome |

## Como funciona

<details>
<summary><b>Quando a barra atualiza</b></summary>

O Claude Code roda `statusline.mjs` a cada evento da sessão (nova resposta, troca de modo, `/compact`) e, com `refreshInterval: 30`, também a cada 30 segundos. O script recebe um JSON com os dados da sessão pela entrada padrão e imprime as linhas coloridas com códigos ANSI.

</details>

<details>
<summary><b>Largura e bonequinho</b></summary>

A largura vem da variável `COLUMNS`, que o Claude Code define antes de rodar o script. Os segmentos são distribuídos em linhas sem passar da largura. O bonequinho reserva 11 colunas à direita das últimas 3 linhas; se a barra tiver menos de 3 linhas, ela ganha linhas só com o bonequinho.

</details>

<details>
<summary><b>Tokens da sessão</b></summary>

O total vem do histórico da conversa (`transcript_path`). A cada atualização, o script lê só o trecho novo do arquivo, ignora a última linha se ela ainda estiver sendo gravada e conta cada resposta uma vez só, mesmo quando ela aparece em várias linhas seguidas. Como o histórico usa um formato interno do Claude Code, se esse formato mudar o dado apenas deixa de aparecer.

</details>

<details>
<summary><b>CPU, GPU, RAM, discos e bateria</b></summary>

- **CPU:** média de uso desde a atualização anterior, calculada pelos tempos dos núcleos. Aparece a partir da segunda atualização.
- **Windows:** `statusline-windows.js` roda com `cscript` e faz uma única consulta WMI de ~300ms, no máximo a cada 25 segundos, com bateria, velocidade da RAM, discos locais e o tempo de uso 3D de cada placa de vídeo.
- **GPU:** o uso é calculado pela diferença entre duas leituras dos contadores brutos do Windows. Isso não acorda a placa de vídeo dedicada e aparece a partir da segunda leitura.
- **RAM:** usada e total vêm do Node; a velocidade é a `ConfiguredClockSpeed` informada pelos módulos.

</details>

<details>
<summary><b>Toque de tarefa concluída</b></summary>

O hook `Stop` roda `tarefa-concluida.ps1` em segundo plano. O script:

1. lê o fim do histórico para achar o último prompt que você digitou e medir quanto tempo a tarefa levou;
2. mostra a notificação com o AppUserModelID do Windows Terminal;
3. toca o `.wav` com `System.Media.SoundPlayer`.

</details>

<details>
<summary><b>Arquivos temporários</b></summary>

Os valores guardados entre execuções ficam na pasta temporária do sistema, em arquivos `claude-statusline-*.json`:

- `cpu`: última amostra dos núcleos;
- `windows`: última consulta WMI;
- `tokens`: posição lida no histórico de até 20 sessões;
- `runtime`: versão do Python por projeto, guardada por 10 minutos.

</details>

## Testes

```powershell
node test/statusline.test.mjs
```

Os testes usam dados simulados, criam um repositório git temporário e conferem cada dado da barra, a largura, o bonequinho e a linha dos subagentes. Para testar os arquivos já instalados:

```powershell
$env:STATUSLINE_DIR = "$HOME\.claude"; node test/statusline.test.mjs
```

## Solução de problemas

<details>
<summary><b>A barra não aparece</b></summary>

- Confirme que o `node` funciona no terminal (`node --version`).
- Confira o caminho em `statusLine.command` no `settings.json`.
- Rode o script à mão para ver erros: `echo '{"model":{"display_name":"Opus"}}' | node ~/.claude/statusline.mjs`.

</details>

<details>
<summary><b>A GPU ou a CPU não aparecem</b></summary>

As duas são médias entre leituras, então só aparecem a partir da segunda atualização da barra. A GPU também precisa de uma placa com contador de uso no Windows.

</details>

<details>
<summary><b>A notificação ou o som não aparecem</b></summary>

- A tarefa precisa levar 15 segundos ou mais.
- Confira se as notificações do Windows Terminal estão ativadas em Configurações → Sistema → Notificações, e se o modo "Não perturbe" está desligado.
- Confira se o caminho do hook `Stop` aponta para o seu `tarefa-concluida.ps1`.

</details>

<details>
<summary><b>O bonequinho sumiu</b></summary>

O terminal está com menos de ~74 colunas. Aumente a janela e ele volta.

</details>

## Créditos

- Paleta baseada no [Dracula](https://draculatheme.com), licença MIT.
- Bonequinho: o desenho da tela de abertura do [Claude Code](https://code.claude.com), da Anthropic.
- *Secret Sound*: jingle de The Legend of Zelda, da Nintendo, recriado por síntese.
- GIF do Link: [GIPHY Gaming](https://giphy.com/gifs/link-the-legend-of-zelda-NVBR6cLvUjV9C).
- Selos: [shields.io](https://shields.io).

## Licença

[MIT](LICENSE) © 2026 Gabriel Muchon Pavanelli
