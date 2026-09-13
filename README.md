# Claude Code · Dracula Black

Visual escuro para o [Claude Code](https://code.claude.com) no Windows Terminal. Inclui:
- tema Dracula com fundo preto;
- uma **status line descritiva** que se ajusta à largura da tela;
- uma linha colorida para cada subagente;
- spinner em português;
- o **bonequinho do Claude Code** no canto inferior direito da barra;
- um **toque de tarefa concluída**: notificação do Windows com resumo e o *Secret Sound* de The Legend of Zelda.

A paleta é baseada no [Dracula](https://draculatheme.com). O visual foi pensado para **daltonismo**: os níveis vão de ciano para amarelo e laranja (nunca de verde para vermelho), e todo estado vem acompanhado de texto, não só de cor.

## Prévia

```
sessão meu-projeto │ modelo Opus · esforço xhigh │ pasta claude-code-dracula-black │ repo gblsun/claude-code-dracula-black │ branch main · 1 alterado │ último commit há 38m      ▐▛███▜▌
contexto ███░░░░░░░ 32% · 64k de 200k │ limite 5h 24% · renova em 2h12m │ limite semanal 41% · renova em 3d03h │ cache ● ativo · expira em 42m · acerto 91%                      ▝▜█████▛▘
custo $1,23 · $1,14/h │ dom 13/09 02:16 │ duração 1h05m │ linhas +156 -23 · 165/h │ cpu 58% · ram 85% │ disco 13 GB livres │ bateria 98% na tomada │ claude v2.1.270               ▘▘ ▝▝
```

A barra distribui os dados em quantas linhas forem necessárias para caber na largura do terminal: em tela larga ficam 3 linhas, em tela estreita, mais. Um dado só aparece quando existe. Por exemplo, git só dentro de um repositório, e PR só com um pull request aberto.

O bonequinho do Claude Code, o mesmo da tela de abertura, fica alinhado à direita das últimas 3 linhas. Os dados usam a largura que sobra, e em terminais com menos de ~74 colunas ele some para não apertar nada.

## O que vem no pacote

| Arquivo | O que faz |
|---|---|
| `claude/statusline.mjs` | Status line principal |
| `claude/subagent-statusline.mjs` | Linha de cada subagente: status, modelo, tokens, tempo e tarefa |
| `claude/palette.mjs` | Paleta Dracula e utilitários usados pelos dois scripts |
| `claude/statusline-battery.js` | Lê a bateria no Windows via WMI (usado pela status line) |
| `claude/tarefa-concluida.ps1` | Toque de tarefa concluída, chamado pelo hook `Stop` |
| `claude/sons/tarefa-concluida.wav` | Som do toque: o *Secret Sound* de The Legend of Zelda, recriado por síntese |
| `claude/sons/gerar-toque-zelda.mjs` | Gera o `.wav` com o jingle do Zelda; ajuste o volume ou as notas |
| `claude/sons/gerar-toque.mjs` | Alternativa: gera um arpejo de sino original no lugar do jingle |
| `claude/themes/dracula.json` | Tema "Dracula Black" do Claude Code, com base no `dark-daltonized` |
| `claude/settings.example.json` | Trecho do `settings.json`: tema, status lines, hook do toque e spinner em português |
| `windows-terminal/dracula-black.json` | Trecho do Windows Terminal: esquema preto, barra de abas preta, transparência, fonte, espaçamento, perfil "Claude Code" e modo Quake |
| `test/statusline.test.mjs` | Testes com dados simulados e um repositório git temporário |

## O que cada dado significa

**Sessão e projeto**

| Dado | Significado |
|---|---|
| `sessão` | Nome da sessão, definido com `/rename` ou gerado automaticamente |
| `modelo` · `esforço` | Modelo que responde e nível de raciocínio (`low` a `max`) |
| `fast mode` · `vim` · `agente` | Modos ativos no momento |
| `pasta` · `repo` | Pasta de trabalho e repositório remoto (clicável com Ctrl+clique) |
| `branch` · `alterados` · `↑ p/ enviar` · `↓ p/ baixar` | Branch atual, arquivos não commitados e commits à frente ou atrás do remoto |
| `stash` · `último commit` | Alterações guardadas com `git stash` e tempo desde o último commit |
| `PR` | Pull request aberto e o estado da revisão: aprovado, pendente, alterações pedidas ou rascunho |
| `projeto` · `node` / `python` | Nome e versão do `package.json` e a versão do runtime do projeto |

**Consumo**

| Dado | Significado |
|---|---|
| `contexto` | Quanto da memória da conversa está ocupado. Perto de 100%, o Claude resume a conversa |
| `limite 5h` · `limite semanal` | Uso dos limites da assinatura e quanto falta para renovarem |
| `cache` | Se o cache está ativo (a próxima mensagem sai mais rápida e barata), quando expira e a taxa de acerto |
| `tokens da sessão` | Total de tokens processados (entrada) e gerados (saída) na sessão |
| `custo` | Custo estimado em dólar e média por hora. Na assinatura é só uma referência |

**Tempo e computador**

| Dado | Significado |
|---|---|
| data e hora · `duração` | Relógio e há quanto tempo a sessão está aberta |
| `linhas` | Linhas adicionadas e removidas pelo Claude, e a média por hora |
| `cpu` · `ram` · `disco` · `bateria` | Uso do computador |
| `claude` | Versão do Claude Code |

## Toque de tarefa concluída

<p align="center">
  <img src="https://media.giphy.com/media/NVBR6cLvUjV9C/giphy.gif" alt="Link, de The Legend of Zelda, de óculos escuros" width="240">
</p>

Quando o Claude termina uma resposta que levou **15 segundos ou mais**, o hook `Stop`:

1. mostra uma notificação do Windows, em nome do Windows Terminal (clicar nela abre o terminal), com:
   - título `✓ Tarefa concluída · <pasta do projeto>`;
   - a primeira linha da resposta final como resumo;
   - quanto tempo a tarefa levou;
2. toca o **Secret Sound** de The Legend of Zelda, o jingle de "segredo encontrado", em volume baixo.

**[🔊 Ouvir o toque](claude/sons/tarefa-concluida.wav)**. O GitHub não toca áudio dentro do README, então o link abre o arquivo para baixar.

Respostas rápidas não disparam nada, para não virar ruído. O hook roda em segundo plano (`async`), então não atrasa o Claude.

- **Mudar o tempo mínimo:** adicione `"-SegundosMinimos", "30"` ao fim de `args` no hook.
- **Volume do jingle:** mude `VOLUME` em `sons/gerar-toque-zelda.mjs` e rode `node sons/gerar-toque-zelda.mjs`.
- **Prefere um som original?** Rode `node sons/gerar-toque.mjs` para trocar o jingle por um arpejo de sino. Também dá para colocar qualquer `.wav` com o nome `tarefa-concluida.wav`.
- **A notificação não aparece?** Confira se as notificações do Windows Terminal estão ativadas em Configurações → Sistema → Notificações, e se o modo "Não perturbe" está desligado.

> The Legend of Zelda é marca da Nintendo. O toque é uma recriação feita por síntese de notas, sem áudio extraído do jogo, e este projeto não tem ligação com a Nintendo. GIF: [GIPHY Gaming](https://giphy.com/gifs/link-the-legend-of-zelda-NVBR6cLvUjV9C).

## Requisitos

- Claude Code recente (testado na versão 2.1.270)
- Node.js 18.15 ou mais novo
- Git 2.35 ou mais novo (para contar o stash)
- Windows Terminal 1.21 ou mais novo, para o espaçamento entre linhas (testado na 1.24)
- Bateria e toque de tarefa concluída: só no Windows (usam `cscript` e Windows PowerShell 5.1)

## Instalação

1. Clone o repositório e copie os arquivos para `~/.claude` (PowerShell):

   ```powershell
   git clone https://github.com/gblsun/claude-code-dracula-black.git
   cd claude-code-dracula-black
   New-Item -ItemType Directory -Force "$HOME\.claude\themes", "$HOME\.claude\sons" | Out-Null
   Copy-Item claude\*.mjs, claude\statusline-battery.js, claude\tarefa-concluida.ps1 "$HOME\.claude\"
   Copy-Item claude\themes\dracula.json "$HOME\.claude\themes\"
   Copy-Item claude\sons\* "$HOME\.claude\sons\"
   ```

2. Mescle o conteúdo de `claude/settings.example.json` no seu `~/.claude/settings.json`. No hook `Stop`, troque `SEU_USUARIO` pelo nome da sua pasta de usuário do Windows.

3. No Windows Terminal, abra o arquivo de configurações (`Ctrl+Shift+,`) e mescle o conteúdo de `windows-terminal/dracula-black.json`:
   - `schemes`, `themes` e `theme`: fundo e barra de abas pretos;
   - `profiles.defaults`: transparência de 35% com desfoque, fonte Cascadia Code, linhas 1,2× mais altas e margem inferior maior;
   - o perfil **Claude Code** (opcional): abre direto no Claude, com aba roxa. Se quiser, gere um GUID novo com `[guid]::NewGuid()`;
   - o atalho do **modo Quake** (opcional): `Win` + tecla à esquerda do `1` faz o terminal descer do topo da tela.

4. Reinicie o Claude Code.

## Personalização

- **Cores da barra:** edite `palette.mjs`.
- **Cores da interface:** `/theme`, selecione **Dracula Black** e aperte `Ctrl+E` para abrir o editor com preview.
- **Tirar ou reordenar dados:** cada dado é um bloco em `statusline.mjs`, na ordem em que aparece.
- **Transparência:** mude `opacity` no Windows Terminal (0 a 100).
- **Esconder o nome da sessão da caixa de digitação:** `/rename ""`.

## Detalhes de funcionamento

- **Tokens da sessão:** somados a partir do histórico da conversa (`transcript_path`), lendo só o trecho novo a cada atualização. O histórico usa um formato interno do Claude Code; se esse formato mudar, o dado apenas deixa de aparecer.
- **CPU:** média desde a atualização anterior da barra. Por isso aparece a partir da segunda atualização.
- **Bateria:** consultada no máximo uma vez por minuto.
- **Arquivos temporários:** os valores guardados entre execuções ficam em `claude-statusline-*.json`, na pasta temporária do sistema.
- **Relógio:** `refreshInterval: 30` faz a barra atualizar sozinha a cada 30 segundos, mesmo sem mensagens novas.
- **Duração da tarefa:** o toque mede do último prompt que você digitou até o fim da resposta, lendo o final do histórico da conversa.

## Testes

```powershell
node test/statusline.test.mjs
```

Os testes usam dados simulados e criam um repositório git temporário. Para testar os arquivos já instalados:

```powershell
$env:STATUSLINE_DIR = "$HOME\.claude"; node test/statusline.test.mjs
```

## Licença

[MIT](LICENSE)
