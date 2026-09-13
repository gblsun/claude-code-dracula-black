// Status line do Claude Code com a paleta do tema ativo.
// Recebe o JSON da sessão via stdin e distribui os dados em linhas que cabem na largura do terminal.
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, statfsSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RESET, ACCENT, INFO, HIGHLIGHT, WARN, CAUTION, MUTED, LABEL, STRONG,
  levelColor, bar, link, readStdinJson, formatDuration, untilEpoch, decimal, shortTokens, packLines,
} from './palette.mjs';

const data = await readStdinJson();

const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
const DOT = `${MUTED} · `;

const run = (command, args) => {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      timeout: 1500,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    }).trim();
  } catch {
    return null;
  }
};

const git = (...args) => run('git', ['-C', cwd, '--no-optional-locks', ...args]);

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const writeJson = (file, value) => {
  try {
    writeFileSync(file, JSON.stringify(value));
  } catch {}
};

const cacheFile = (name) => path.join(os.tmpdir(), `claude-statusline-${name}.json`);

const percent = (label, value) => {
  const p = Math.round(value);
  return `${LABEL}${label} ${levelColor(p)}${p}%`;
};

// Branch, arquivos alterados, commits à frente/atrás e stash numa chamada só.
const gitStatus = () => {
  // Fora de um repositório, não gasta tempo chamando o git.
  if (!findUp(['.git'])) return null;
  const out = git('status', '--porcelain=v2', '--branch', '--show-stash');
  if (out == null) return null;
  const info = { branch: null, changed: 0, ahead: 0, behind: 0, stash: 0 };
  for (const line of out.split('\n')) {
    if (line.startsWith('# branch.head ')) {
      info.branch = line.slice('# branch.head '.length);
    } else if (line.startsWith('# branch.ab ')) {
      const [, ahead, behind] = line.match(/\+(\d+) -(\d+)/) ?? [];
      info.ahead = Number(ahead ?? 0);
      info.behind = Number(behind ?? 0);
    } else if (line.startsWith('# stash ')) {
      info.stash = Number(line.slice('# stash '.length));
    } else if (line && !line.startsWith('#')) {
      info.changed++;
    }
  }
  return info;
};

// Tokens gastos na sessão, somados do histórico da conversa. Lê só o trecho novo
// desde a última execução. Depende do formato interno do histórico: se ele mudar,
// o dado apenas some da barra.
const TOKENS_CACHE = cacheFile('tokens');

const sessionTokens = (transcript) => {
  if (!transcript || !existsSync(transcript)) return null;
  const all = readJson(TOKENS_CACHE) ?? {};
  const fresh = { offset: 0, input: 0, output: 0, lastId: null, lastInput: 0, lastOutput: 0 };
  let state = all[transcript] ?? fresh;
  const size = statSync(transcript).size;
  if (size < state.offset) state = fresh;
  if (size > state.offset) {
    const buffer = Buffer.alloc(size - state.offset);
    const fd = openSync(transcript, 'r');
    try {
      readSync(fd, buffer, 0, buffer.length, state.offset);
    } finally {
      closeSync(fd);
    }
    // Só linhas completas: a última pode ainda estar sendo gravada.
    const complete = buffer.lastIndexOf(0x0a) + 1;
    for (const line of buffer.subarray(0, complete).toString('utf8').split('\n')) {
      if (!line.includes('"usage"')) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      const { message } = entry;
      if (entry.type !== 'assistant' || !message?.usage) continue;
      const u = message.usage;
      const input = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      const output = u.output_tokens ?? 0;
      // A mesma resposta é gravada em várias linhas seguidas: conta só a última.
      if (message.id && message.id === state.lastId) {
        state.input -= state.lastInput;
        state.output -= state.lastOutput;
      }
      state.input += input;
      state.output += output;
      state.lastId = message.id ?? null;
      state.lastInput = input;
      state.lastOutput = output;
    }
    state.offset += complete;
  }
  delete all[transcript];
  all[transcript] = state;
  // Guarda só as 20 sessões mais recentes.
  for (const key of Object.keys(all).slice(0, -20)) delete all[key];
  writeJson(TOKENS_CACHE, all);
  return state;
};

// CPU média desde a execução anterior, guardada num arquivo temporário,
// para não precisar esperar uma amostra a cada atualização.
const CPU_CACHE = cacheFile('cpu');

const cpuPercent = () => {
  const times = os.cpus().reduce(
    (acc, { times: t }) => ({ idle: acc.idle + t.idle, total: acc.total + t.user + t.nice + t.sys + t.idle + t.irq }),
    { idle: 0, total: 0 },
  );
  const now = { ...times, at: Date.now() };
  const prev = readJson(CPU_CACHE);
  // Intervalo curto demais dá leitura instável: reaproveita o último valor.
  if (prev && now.at - prev.at < 2000) return prev.pct ?? null;
  const usable = prev && now.at - prev.at < 120000 && now.total > prev.total;
  now.pct = usable ? Math.round(100 * (1 - (now.idle - prev.idle) / (now.total - prev.total))) : null;
  writeJson(CPU_CACHE, now);
  return now.pct;
};

// Bateria via WMI com cscript (~150ms), consultada no máximo uma vez por minuto.
const BATTERY_CACHE = cacheFile('battery');
const BATTERY_SCRIPT = fileURLToPath(new URL('./statusline-battery.js', import.meta.url));
const CHARGING = new Set([6, 7, 8, 9]);

const battery = () => {
  if (process.platform !== 'win32' || !existsSync(BATTERY_SCRIPT)) return null;
  let cached = readJson(BATTERY_CACHE);
  if (!cached || !(Date.now() - cached.at < 60000)) {
    const match = run('cscript.exe', ['//nologo', BATTERY_SCRIPT])?.match(/^(\d+)\s+(\d+)/);
    cached = { at: Date.now(), pct: match ? Number(match[1]) : null, status: match ? Number(match[2]) : null };
    writeJson(BATTERY_CACHE, cached);
  }
  return cached.pct != null ? cached : null;
};

// Procura um arquivo subindo a partir da pasta atual, sem sair do repositório git.
const findUp = (names) => {
  let dir = cwd;
  for (let depth = 0; depth < 8; depth++) {
    const name = names.find((n) => existsSync(path.join(dir, n)));
    if (name) return { dir, file: path.join(dir, name) };
    const parent = path.dirname(dir);
    if (parent === dir || existsSync(path.join(dir, '.git'))) return null;
    dir = parent;
  }
  return null;
};

// Versão do Python do projeto (venv primeiro), guardada por 10 minutos.
const RUNTIME_CACHE = cacheFile('runtime');

const pythonVersion = (projectDir) => {
  const cache = readJson(RUNTIME_CACHE) ?? {};
  const hit = cache[projectDir];
  if (hit && Date.now() - hit.at < 600000) return hit.version;
  const venvs = ['.venv', 'venv']
    .flatMap((v) => [path.join(projectDir, v, 'Scripts', 'python.exe'), path.join(projectDir, v, 'bin', 'python')])
    .filter(existsSync);
  let version = null;
  for (const bin of [...venvs, 'python', 'python3']) {
    const match = run(bin, ['--version'])?.match(/Python (\S+)/);
    if (match) {
      version = match[1];
      break;
    }
  }
  cache[projectDir] = { version, at: Date.now() };
  writeJson(RUNTIME_CACHE, cache);
  return version;
};

// Estado de revisão com cor e palavra (a cor sozinha não basta para daltonismo).
const PR_STATES = [
  [/approv/i, INFO, 'aprovado'],
  [/change/i, WARN, 'alterações pedidas'],
  [/draft/i, LABEL, 'rascunho'],
  [/./, CAUTION, 'pendente'],
];

const segments = [];

// Sessão, modelo e modos
if (data.session_name) segments.push(`${LABEL}sessão ${HIGHLIGHT}${data.session_name}`);

let model = `${LABEL}modelo ${ACCENT}${data.model?.display_name ?? 'Claude'}`;
if (data.effort?.level) model += `${DOT}${LABEL}esforço ${ACCENT}${data.effort.level}`;
segments.push(model);

if (data.fast_mode) segments.push(`${CAUTION}fast mode`);
if (data.vim?.mode) segments.push(`${LABEL}vim ${INFO}${data.vim.mode}`);
if (data.agent?.name) segments.push(`${LABEL}agente ${HIGHLIGHT}${data.agent.name}`);

// Pasta, repositório, git e PR
segments.push(`${LABEL}pasta ${INFO}${path.basename(cwd) || cwd}`);

const repo = data.workspace?.repo;
if (repo?.owner && repo?.name) {
  const slug = `${repo.owner}/${repo.name}`;
  segments.push(`${LABEL}repo ${INFO}${link(`https://${repo.host ?? 'github.com'}/${slug}`, slug)}`);
}

const status = gitStatus();
if (status?.branch) {
  const parts = [`${LABEL}branch ${HIGHLIGHT}${status.branch}`];
  if (status.changed) parts.push(`${WARN}${status.changed} ${status.changed === 1 ? 'alterado' : 'alterados'}`);
  if (status.ahead) parts.push(`${INFO}↑${status.ahead} p/ enviar`);
  if (status.behind) parts.push(`${CAUTION}↓${status.behind} p/ baixar`);
  segments.push(parts.join(DOT));

  const history = [];
  if (status.stash) history.push(`${LABEL}stash ${STRONG}${status.stash}`);
  const lastCommit = Number(git('log', '-1', '--format=%ct'));
  if (lastCommit) history.push(`${LABEL}último commit ${STRONG}há ${formatDuration(Date.now() - lastCommit * 1000)}`);
  if (history.length) segments.push(history.join(DOT));
}

if (data.pr?.number) {
  const label = `PR #${data.pr.number}`;
  let pr = `${ACCENT}${data.pr.url ? link(data.pr.url, label) : label}`;
  if (data.pr.review_state) {
    const [, color, word] = PR_STATES.find(([re]) => re.test(data.pr.review_state));
    pr += ` ${color}${word}`;
  }
  segments.push(pr);
}

// Consumo: contexto, limites, cache, tokens e custo
const cw = data.context_window ?? {};
const ctx = Math.round(cw.used_percentage ?? 0);
let context = `${LABEL}contexto ${bar(ctx, 10)} ${levelColor(ctx)}${ctx}%`;
if (cw.context_window_size) {
  const u = cw.current_usage;
  const used = u
    ? (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
    : Math.round((ctx / 100) * cw.context_window_size);
  context += `${DOT}${STRONG}${shortTokens(used)} ${LABEL}de ${STRONG}${shortTokens(cw.context_window_size)}`;
}
segments.push(context);

for (const [label, window] of [['limite 5h', data.rate_limits?.five_hour], ['limite semanal', data.rate_limits?.seven_day]]) {
  if (window?.used_percentage == null) continue;
  let segment = percent(label, window.used_percentage);
  if (window.resets_at) segment += `${DOT}${LABEL}renova em ${STRONG}${untilEpoch(window.resets_at)}`;
  segments.push(segment);
}

const cache = data.prompt_cache;
if (cache) {
  const parts = [`${LABEL}cache ${cache.warm ? `${INFO}● ativo` : `${LABEL}● expirado`}`];
  if (cache.warm && cache.expires_at) parts.push(`${LABEL}expira em ${STRONG}${untilEpoch(cache.expires_at)}`);
  if (cache.hit_ratio != null) parts.push(`${LABEL}acerto ${STRONG}${Math.round(cache.hit_ratio * 100)}%`);
  segments.push(parts.join(DOT));
}

const tokens = sessionTokens(data.transcript_path);
if (tokens && (tokens.input || tokens.output)) {
  segments.push(
    `${LABEL}tokens da sessão ${STRONG}${shortTokens(tokens.input)} ${LABEL}entrada` +
      `${DOT}${STRONG}${shortTokens(tokens.output)} ${LABEL}saída`,
  );
}

const cost = data.cost ?? {};
const hours = (cost.total_duration_ms ?? 0) / 3600000;
// Taxas por hora só depois de 5 minutos, para não mostrar números distorcidos.
const showRates = hours >= 5 / 60;

if (cost.total_cost_usd != null) {
  let segment = `${LABEL}custo ${ACCENT}$${decimal(cost.total_cost_usd)}`;
  if (showRates) segment += `${DOT}${STRONG}$${decimal(cost.total_cost_usd / hours)}${LABEL}/h`;
  segments.push(segment);
}

// Data, sessão, projeto e computador
const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const now = new Date();
const two = (n) => String(n).padStart(2, '0');
segments.push(`${STRONG}${DAYS[now.getDay()]} ${two(now.getDate())}/${two(now.getMonth() + 1)} ${two(now.getHours())}:${two(now.getMinutes())}`);

if (cost.total_duration_ms) segments.push(`${LABEL}duração ${ACCENT}${formatDuration(cost.total_duration_ms)}`);

const added = cost.total_lines_added ?? 0;
const removed = cost.total_lines_removed ?? 0;
if (added || removed) {
  let segment = `${LABEL}linhas ${INFO}+${added} ${WARN}-${removed}`;
  if (showRates) segment += `${DOT}${STRONG}${Math.round((added + removed) / hours)}${LABEL}/h`;
  segments.push(segment);
}

const pkg = findUp(['package.json']);
if (pkg) {
  const json = readJson(pkg.file);
  if (json) {
    const version = json.version ? ` ${ACCENT}v${json.version}` : '';
    segments.push(`${LABEL}projeto ${STRONG}${json.name ?? path.basename(pkg.dir)}${version}`);
  }
  segments.push(`${LABEL}node ${STRONG}${process.version}`);
} else {
  const py = findUp(['pyproject.toml', 'requirements.txt', 'setup.py', '.python-version']);
  const version = py && pythonVersion(py.dir);
  if (version) segments.push(`${LABEL}python ${STRONG}${version}`);
}

const cpu = cpuPercent();
const ram = Math.round(100 * (1 - os.freemem() / os.totalmem()));
segments.push([cpu != null ? percent('cpu', cpu) : null, percent('ram', ram)].filter(Boolean).join(DOT));

try {
  const disk = statfsSync(cwd);
  const freeGb = (disk.bavail * disk.bsize) / 1024 ** 3;
  const freeRatio = disk.bavail / disk.blocks;
  const color = freeRatio < 0.1 ? WARN : freeRatio < 0.25 ? CAUTION : INFO;
  segments.push(`${LABEL}disco ${color}${decimal(freeGb, freeGb < 10 ? 1 : 0)} GB ${LABEL}livres`);
} catch {}

const bat = battery();
if (bat) {
  const color = bat.pct < 20 ? WARN : bat.pct < 50 ? CAUTION : INFO;
  let segment = `${LABEL}bateria ${color}${bat.pct}%`;
  if (CHARGING.has(bat.status)) segment += `${LABEL} carregando`;
  else if (bat.status === 2) segment += `${LABEL} na tomada`;
  segments.push(segment);
}

if (data.version) segments.push(`${LABEL}claude ${STRONG}v${data.version}`);

const width = Math.max(40, (Number(process.env.COLUMNS) || 120) - 4);
const lines = packLines(segments, width, `${MUTED} │ `);
process.stdout.write(lines.map((line) => line + RESET).join('\n') + '\n');
