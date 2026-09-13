// Testes do instalador. Rodam num diretório temporário, sem tocar nas suas configurações de verdade.
// Uso: node test/install.test.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = fileURLToPath(new URL('..', import.meta.url));
const WINDOWS = process.platform === 'win32';

let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}`);
  if (!cond) ok = false;
};

const work = mkdtempSync(path.join(os.tmpdir(), 'install-test-'));
const claudeDir = path.join(work, 'claude');
const localAppData = path.join(work, 'local');
const terminalDir = path.join(localAppData, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState');

const install = (env, ...flags) =>
  spawnSync(process.execPath, [path.join(repoDir, 'install.mjs'), ...flags], {
    encoding: 'utf8',
    env: { ...process.env, LOCALAPPDATA: localAppData, ...env },
  });
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const toques = (settings) => (settings.hooks?.Stop ?? []).flatMap((g) => g.hooks).filter((h) => JSON.stringify(h).includes('tarefa-concluida.ps1'));

try {
  mkdirSync(claudeDir, { recursive: true });
  mkdirSync(terminalDir, { recursive: true });

  // Configurações que já existiam e precisam ser mantidas.
  writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify({
    model: 'opus',
    theme: 'dark',
    hooks: {
      Notification: [{ hooks: [{ type: 'command', command: 'echo aviso' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'echo outro' }] }],
    },
  }, null, 2));

  // settings.json do Windows Terminal com comentários e vírgulas sobrando, que ele aceita.
  writeFileSync(path.join(terminalDir, 'settings.json'), `{
    // comentário de linha com "aspas" e https://exemplo.com
    "$schema": "https://aka.ms/terminal-profiles-schema",
    "defaultProfile": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
    /* comentário
       de bloco */
    "profiles": {
      "defaults": { "font": { "size": 11 } },
      "list": [ { "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}", "name": "Windows PowerShell" }, ]
    },
    "schemes": [ { "name": "Campbell", "background": "#0C0C0C" } ],
  }`);

  const env = { CLAUDE_CONFIG_DIR: claudeDir };

  {
    const r = install(env, '--simular');
    check(r.status === 0, 'simulação roda sem erro');
    const created = readdirSync(claudeDir).filter((f) => f !== 'settings.json');
    check(created.length === 0 && !readdirSync(terminalDir).some((f) => f.includes('.bak-')), 'simulação não cria nem altera arquivos');
  }

  {
    const r = install(env);
    console.log('--- saída da instalação');
    console.log(r.stdout.trimEnd().split('\n').map((l) => '  ' + l).join('\n'));
    check(r.status === 0, `instalação roda sem erro ${r.stderr}`);
    for (const file of ['statusline.mjs', 'subagent-statusline.mjs', 'palette.mjs', 'statusline-windows.js', 'tarefa-concluida.ps1', 'themes/midnight-synthwave.json', 'sons/tarefa-concluida.wav', 'sons/gerar-toque-zelda.mjs']) {
      check(existsSync(path.join(claudeDir, file)), `copia ${file}`);
    }
    check(readFileSync(path.join(claudeDir, 'tarefa-concluida.ps1'))[0] === 0xef, 'mantém o BOM do .ps1 (acentos no Windows PowerShell 5.1)');

    const settings = readJson(path.join(claudeDir, 'settings.json'));
    check(settings.model === 'opus' && settings.hooks.Notification?.length === 1, 'mantém configurações e hooks que já existiam');
    check(settings.theme === 'custom:midnight-synthwave', 'ativa o tema Midnight Synthwave');
    check(settings.statusLine.command === `node ${claudeDir.replace(/\\/g, '/')}/statusline.mjs` && settings.statusLine.refreshInterval === 30, 'status line com o caminho do usuário');
    check(settings.subagentStatusLine.command.endsWith('/subagent-statusline.mjs'), 'linha dos subagentes');
    check(settings.spinnerVerbs.verbs.includes('Cruzando o grid') && settings.spinnerTipsOverride.tips.length === 5, 'spinner e dicas em português');
    check(readdirSync(claudeDir).filter((f) => f.startsWith('settings.json.bak-')).length === 1, 'backup do settings.json do Claude Code');

    if (WINDOWS) {
      const toque = toques(settings);
      check(toque.length === 1 && toque[0].args.at(-1) === path.join(claudeDir, 'tarefa-concluida.ps1') && toque[0].async === true, 'toque com o caminho do usuário, em segundo plano');
      check(settings.hooks.Stop.some((g) => g.hooks.some((h) => h.command === 'echo outro')), 'mantém outros hooks Stop');

      const terminal = readJson(path.join(terminalDir, 'settings.json'));
      check(terminal.theme === 'Midnight Synthwave' && terminal.schemes.some((s) => s.name === 'Campbell') && terminal.schemes.some((s) => s.name === 'Midnight Synthwave'), 'terminal: esquema e tema novos, esquemas antigos mantidos');
      const d = terminal.profiles.defaults;
      check(d.colorScheme === 'Midnight Synthwave' && d.opacity === 25 && d.useAcrylic && d.font.face === 'Cascadia Code' && d.font.size === 11, 'terminal: padrões aplicados sem perder o tamanho da fonte');
      const perfil = terminal.profiles.list.filter((p) => p.name === 'Claude Code');
      check(perfil.length === 1 && /^\{[0-9a-f-]{36}\}$/.test(perfil[0].guid) && terminal.profiles.list.some((p) => p.name === 'Windows PowerShell'), 'terminal: perfil "Claude Code" com GUID novo, perfis antigos mantidos');
      check(terminal.keybindings.filter((k) => k.id === 'Terminal.QuakeMode').length === 1, 'terminal: atalho do modo Quake');
      check(readdirSync(terminalDir).filter((f) => f.startsWith('settings.json.bak-')).length === 1, 'terminal: backup do settings.json');
    }
  }

  {
    const guidAntes = WINDOWS ? readJson(path.join(terminalDir, 'settings.json')).profiles.list.find((p) => p.name === 'Claude Code').guid : null;
    const r = install(env);
    check(r.status === 0, 'rodar de novo funciona');
    if (WINDOWS) {
      const settings = readJson(path.join(claudeDir, 'settings.json'));
      const terminal = readJson(path.join(terminalDir, 'settings.json'));
      check(toques(settings).length === 1, 'reinstalar não duplica o toque');
      check(
        terminal.profiles.list.filter((p) => p.name === 'Claude Code').length === 1 &&
          terminal.profiles.list.find((p) => p.name === 'Claude Code').guid === guidAntes &&
          terminal.keybindings.filter((k) => k.id === 'Terminal.QuakeMode').length === 1 &&
          terminal.schemes.filter((s) => s.name === 'Midnight Synthwave').length === 1,
        'reinstalar não duplica perfil, atalho nem esquema, e mantém o GUID do perfil',
      );
    }
  }

  {
    // Instalação do zero, sem settings.json, pulando o toque e o terminal.
    const fresh = path.join(work, 'claude-novo');
    const terminalAntes = readFileSync(path.join(terminalDir, 'settings.json'), 'utf8');
    const r = install({ CLAUDE_CONFIG_DIR: fresh }, '--sem-toque', '--sem-terminal');
    const settings = readJson(path.join(fresh, 'settings.json'));
    check(r.status === 0 && settings.theme === 'custom:midnight-synthwave' && !settings.hooks, 'do zero com --sem-toque: cria o settings.json sem hook');
    check(readFileSync(path.join(terminalDir, 'settings.json'), 'utf8') === terminalAntes, '--sem-terminal não mexe no Windows Terminal');
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(ok ? '\nTODOS OS TESTES PASSARAM' : '\nHOUVE FALHAS');
process.exit(ok ? 0 : 1);
