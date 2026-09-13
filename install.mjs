// Instalador do Midnight Synthwave para o Claude Code e o Windows Terminal.
// Copia os arquivos para ~/.claude e junta as configurações, com backup antes de alterar qualquer arquivo.
// Pode rodar de novo a qualquer momento: nada é duplicado e as outras configurações são mantidas.
// Uso: node install.mjs [--simular] [--sem-terminal] [--sem-toque]
import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const flags = new Set(process.argv.slice(2));
const SIMULAR = flags.has('--simular');
const WINDOWS = process.platform === 'win32';
const repoDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(repoDir, 'claude');
const claudeDir = process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const backups = [];

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 18 || (major === 18 && minor < 15)) {
  console.error(`Node.js ${process.versions.node} é antigo demais: instale a versão 18.15 ou mais nova.`);
  process.exit(1);
}

const step = (text) => console.log(`\n▸ ${text}`);
const done = (text) => console.log(`  ${SIMULAR ? '(simulação) ' : ''}${text}`);

// Remove comentários e vírgulas sobrando fora de strings: o settings.json do Windows Terminal aceita os dois.
const toStrictJson = (text) => {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
      } else if (ch === '"') {
        inString = false;
      }
    } else if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (ch === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
    } else if (ch === '}' || ch === ']') {
      out = out.replace(/,(\s*)$/, '$1') + ch;
    } else {
      out += ch;
    }
  }
  return out;
};

const readJson = (file, fallback) => {
  if (!existsSync(file)) return fallback;
  const text = readFileSync(file, 'utf8');
  return JSON.parse(toStrictJson(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text));
};

const saveJson = (file, data, indent) => {
  if (existsSync(file)) {
    const backup = `${file}.bak-${stamp}`;
    if (!SIMULAR) copyFileSync(file, backup);
    backups.push(backup);
  }
  if (!SIMULAR) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(data, null, indent) + '\n');
  }
};

// 1. Arquivos
step(`Copiando arquivos para ${claudeDir}`);
const copies = [
  ...readdirSync(sourceDir).filter((file) => /\.(mjs|js|ps1)$/.test(file)),
  'themes/midnight-synthwave.json',
  ...readdirSync(path.join(sourceDir, 'sons')).map((file) => `sons/${file}`),
];
for (const file of copies) {
  const target = path.join(claudeDir, file);
  if (!SIMULAR) {
    mkdirSync(path.dirname(target), { recursive: true });
    copyFileSync(path.join(sourceDir, file), target);
  }
}
done(`${copies.length} arquivos: scripts da barra, tema e sons`);

// 2. Claude Code
step('Configurando o Claude Code');
const settingsFile = path.join(claudeDir, 'settings.json');
const settings = readJson(settingsFile, {});
const example = JSON.parse(readFileSync(path.join(sourceDir, 'settings.example.json'), 'utf8'));
const claudePath = claudeDir.replace(/\\/g, '/');

settings.theme = example.theme;
settings.statusLine = { ...example.statusLine, command: `node ${claudePath}/statusline.mjs` };
settings.subagentStatusLine = { ...example.subagentStatusLine, command: `node ${claudePath}/subagent-statusline.mjs` };
settings.spinnerVerbs = example.spinnerVerbs;
settings.spinnerTipsOverride = example.spinnerTipsOverride;
done('tema, status line, linha dos subagentes e spinner em português');

if (WINDOWS && !flags.has('--sem-toque')) {
  const hook = structuredClone(example.hooks.Stop[0].hooks[0]);
  hook.args = hook.args.map((arg) => (arg.endsWith('tarefa-concluida.ps1') ? path.join(claudeDir, 'tarefa-concluida.ps1') : arg));
  settings.hooks ??= {};
  // Tira uma instalação anterior do toque antes de adicionar, para ele não tocar duas vezes.
  const others = (settings.hooks.Stop ?? [])
    .map((group) => ({ ...group, hooks: (group.hooks ?? []).filter((h) => !JSON.stringify(h).includes('tarefa-concluida.ps1')) }))
    .filter((group) => group.hooks.length);
  settings.hooks.Stop = [...others, { hooks: [hook] }];
  done('toque de tarefa concluída (hook Stop) com o caminho do seu usuário');
}
saveJson(settingsFile, settings, 2);

// 3. Windows Terminal
if (WINDOWS && !flags.has('--sem-terminal')) {
  step('Configurando o Windows Terminal');
  const localAppData = process.env.LOCALAPPDATA ?? '';
  const terminalFile = [
    path.join(localAppData, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(localAppData, 'Packages', 'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(localAppData, 'Microsoft', 'Windows Terminal', 'settings.json'),
  ].find((file) => existsSync(file));

  let terminal = null;
  if (!terminalFile) {
    done('Windows Terminal não encontrado: abra-o uma vez e rode o instalador de novo');
  } else {
    try {
      terminal = readJson(terminalFile);
    } catch (error) {
      done(`não consegui ler ${terminalFile} (${error.message}); junte windows-terminal/midnight-synthwave.json à mão`);
    }
  }

  if (terminal) {
    const snippet = JSON.parse(readFileSync(path.join(repoDir, 'windows-terminal', 'midnight-synthwave.json'), 'utf8'));
    const upsert = (list, item) => [...(list ?? []).filter((existing) => existing.name !== item.name), item];
    for (const scheme of snippet.schemes) terminal.schemes = upsert(terminal.schemes, scheme);
    for (const theme of snippet.themes) terminal.themes = upsert(terminal.themes, theme);
    terminal.theme = snippet.theme;

    // Formato antigo: "profiles" era direto a lista de perfis.
    if (Array.isArray(terminal.profiles)) terminal.profiles = { list: terminal.profiles };
    terminal.profiles ??= {};
    const defaults = terminal.profiles.defaults ?? {};
    terminal.profiles.defaults = {
      ...defaults,
      ...snippet.profiles.defaults,
      font: { ...(defaults.font ?? {}), ...snippet.profiles.defaults.font },
    };

    terminal.profiles.list ??= [];
    const profile = snippet.profiles.list[0];
    const existing = terminal.profiles.list.find((p) => p.name === profile.name);
    if (existing) Object.assign(existing, { ...profile, guid: existing.guid });
    else terminal.profiles.list.push({ ...profile, guid: `{${randomUUID()}}` });

    const quake = snippet.keybindings[0];
    const bindings = [...(terminal.keybindings ?? []), ...(terminal.actions ?? [])];
    if (!bindings.some((b) => b.id === quake.id || b.command === 'quakeMode')) {
      terminal.keybindings = [...(terminal.keybindings ?? []), quake];
    }

    saveJson(terminalFile, terminal, 4);
    done('esquema e tema da janela, transparência, fonte, perfil "Claude Code" e modo Quake');
  }
}

console.log(`\n✔ ${SIMULAR ? 'Simulação concluída: nenhum arquivo foi alterado.' : 'Midnight Synthwave instalado.'}`);
if (backups.length) {
  console.log(`  Backups ${SIMULAR ? 'que seriam criados' : 'criados'}:`);
  for (const backup of backups) console.log(`    ${backup}`);
}
if (!SIMULAR) console.log('  Reinicie o Claude Code para ver o tema, a barra e o spinner novos.');
