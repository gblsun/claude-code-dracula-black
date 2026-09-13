// Status line do Claude Code com a paleta do tema ativo.
// Recebe o JSON da sessão via stdin e distribui os dados em linhas que cabem na largura do terminal.
import { execFileSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync, statfsSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RESET, ACCENT, INFO, HIGHLIGHT, WARN, CAUTION, MUTED, LABEL, STRONG,
  rgb, levelColor, bar, link, readStdinJson, formatDuration, untilEpoch, decimal, shortTokens, packLines, visibleLength,
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

// Bateria, velocidade da RAM, discos e GPU via WMI: um cscript de ~300ms,
// rodado no máximo a cada 25 segundos. O uso da GPU é a média desde a leitura anterior.
const WINDOWS_CACHE = cacheFile('windows');
const WINDOWS_SCRIPT = fileURLToPath(new URL('./statusline-windows.js', import.meta.url));
const CHARGING = new Set([6, 7, 8, 9]);

const windowsInfo = () => {
  if (process.platform !== 'win32' || !existsSync(WINDOWS_SCRIPT)) return null;
  const cached = readJson(WINDOWS_CACHE);
  if (cached && Date.now() - cached.at < 25000) return cached;
  const out = run('cscript.exe', ['//nologo', WINDOWS_SCRIPT]);
  if (out == null) return cached;
  const info = { at: Date.now(), battery: null, ramMhz: null, disks: [], gpuTimes: {}, gpu: null };
  for (const line of out.split(/\r?\n/)) {
    const [kind, ...values] = line.trim().split(' ');
    if (kind === 'BAT') info.battery = { pct: Number(values[0]), status: Number(values[1]) };
    else if (kind === 'RAM') info.ramMhz = Number(values[0]);
    else if (kind === 'DISK') info.disks.push({ id: values[0], free: Number(values[1]), size: Number(values[2]) });
    else if (kind === 'GPU') info.gpuTimes[values[0]] = Number(values[1]);
  }
  // Tempo de GPU gasto no intervalo (100 ns) dividido pelo tempo decorrido, na placa mais ocupada.
  if (cached?.gpuTimes && info.at - cached.at < 300000) {
    const elapsed = (info.at - cached.at) * 1e4;
    const usage = Object.entries(info.gpuTimes)
      .filter(([luid, time]) => cached.gpuTimes[luid] != null && time >= cached.gpuTimes[luid])
      .map(([luid, time]) => ((time - cached.gpuTimes[luid]) / elapsed) * 100);
    if (usage.length) info.gpu = Math.min(100, Math.round(Math.max(...usage)));
  }
  writeJson(WINDOWS_CACHE, info);
  return info;
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

const win = windowsInfo();

// CPU, GPU e RAM (usada/total)
const cpu = cpuPercent();
const hardware = [];
if (cpu != null) hardware.push(percent('cpu', cpu));
if (win?.gpu != null) hardware.push(percent('gpu', win.gpu));
const totalGb = os.totalmem() / 1024 ** 3;
const usedGb = totalGb - os.freemem() / 1024 ** 3;
const ramPct = Math.round((usedGb / totalGb) * 100);
hardware.push(`${LABEL}ram ${STRONG}${decimal(usedGb, 1)}${LABEL}/${decimal(totalGb, 1)} GB ${levelColor(ramPct)}${ramPct}%`);
if (win?.ramMhz) hardware.push(`${STRONG}${win.ramMhz} ${LABEL}MHz`);
segments.push(hardware.join(DOT));

// Espaço livre de cada disco: no Windows, todos os discos locais; nos outros sistemas, o da pasta atual.
const toGb = (bytes) => bytes / 1024 ** 3;
let disks = win?.disks ?? [];
if (!disks.length) {
  try {
    const disk = statfsSync(cwd);
    disks = [{ id: '', free: disk.bavail * disk.bsize, size: disk.blocks * disk.bsize }];
  } catch {}
}
if (disks.length) {
  const text = disks.map(({ id, free, size }) => {
    const ratio = free / size;
    const color = ratio < 0.1 ? WARN : ratio < 0.25 ? CAUTION : INFO;
    const freeGb = toGb(free);
    return `${id ? `${LABEL}${id} ` : ''}${color}${decimal(freeGb, freeGb < 10 ? 1 : 0)}${LABEL}/${decimal(toGb(size), 0)} GB livres`;
  });
  segments.push(`${LABEL}discos ${text.join(DOT)}`);
}

const bat = win?.battery;
if (bat) {
  const color = bat.pct < 20 ? WARN : bat.pct < 50 ? CAUTION : INFO;
  let segment = `${LABEL}bateria ${color}${bat.pct}%`;
  if (CHARGING.has(bat.status)) segment += `${LABEL} carregando`;
  else if (bat.status === 2) segment += `${LABEL} na tomada`;
  segments.push(segment);
}

if (data.version) segments.push(`${LABEL}claude ${STRONG}v${data.version}`);

const width = Math.max(40, (Number(process.env.COLUMNS) || 120) - 4);

// Bonequinho do Claude Code no canto inferior direito, com o mesmo desenho da tela de abertura.
// Os dados ocupam a largura que sobra; em terminais estreitos ele não aparece.
const MASCOT = [' ▐▛███▜▌ ', '▝▜█████▛▘', '  ▘▘ ▝▝  '];
const MASCOT_COLOR = rgb('#d77757');
const showMascot = width >= 70;
const MASCOT_GAP = 2;

const lines = packLines(segments, showMascot ? width - MASCOT[0].length - MASCOT_GAP : width, `${MUTED} │ `);

if (showMascot) {
  while (lines.length < MASCOT.length) lines.push('');
  const first = lines.length - MASCOT.length;
  MASCOT.forEach((row, r) => {
    const line = lines[first + r];
    // O RESET antes dos espaços evita que uma linha só com o bonequinho perca o alinhamento.
    const pad = ' '.repeat(Math.max(0, width - row.length - visibleLength(line)));
    lines[first + r] = `${line}${RESET}${pad}${MASCOT_COLOR}${row}`;
  });
}

process.stdout.write(lines.map((line) => line + RESET).join('\n') + '\n');
