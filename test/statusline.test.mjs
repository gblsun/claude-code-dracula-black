// Testes da status line e da linha dos subagentes.
// Uso: node test/statusline.test.mjs
// Para testar os scripts instalados em outra pasta: STATUSLINE_DIR=~/.claude node test/statusline.test.mjs
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptsDir = process.env.STATUSLINE_DIR ?? fileURLToPath(new URL('../claude/', import.meta.url));
const { visibleLength } = await import(pathToFileURL(path.join(scriptsDir, 'palette.mjs')).href);

const BOM = String.fromCharCode(0xfeff);
const WINDOWS = process.platform === 'win32';
const GB = 1024 ** 3;
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\]8;;[^\x1b]*\x1b\\/g, '');
const nowSec = () => Math.floor(Date.now() / 1000);

const run = (script, input, columns = 250) => {
  const t0 = performance.now();
  const r = spawnSync(process.execPath, [path.join(scriptsDir, script)], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, COLUMNS: String(columns) },
  });
  const ms = Math.round(performance.now() - t0);
  if (r.status !== 0) throw new Error(`${script} falhou: ${r.stderr}`);
  const lines = r.stdout.trimEnd().split('\n');
  return { out: r.stdout, lines, all: lines.map(strip).join(' │ '), ms };
};

let ok = true;
const check = (cond, msg) => {
  console.log(`${cond ? 'OK   ' : 'FALHA'} ${msg}`);
  if (!cond) ok = false;
};

const work = mkdtempSync(path.join(os.tmpdir(), 'statusline-test-'));

try {
  // Repositório de teste: 1 commit enviado ao remoto e 1 só local (à frente 1),
  // 1 stash, 1 arquivo modificado e 1 arquivo novo (2 alterados).
  const repo = path.join(work, 'repo-git');
  const remote = path.join(work, 'remoto.git');
  mkdirSync(repo);
  const git = (...args) => {
    const r = spawnSync('git', args, { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  };
  git('init', '-q', '--bare', '-b', 'main', remote);
  git('-C', repo, 'init', '-q', '-b', 'main');
  git('-C', repo, 'config', 'user.email', 'teste@exemplo.com');
  git('-C', repo, 'config', 'user.name', 'Teste');
  writeFileSync(path.join(repo, 'a.txt'), '1');
  writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ name: 'meu-app', version: '1.2.3' }));
  git('-C', repo, 'add', '.');
  git('-C', repo, 'commit', '-q', '-m', 'primeiro');
  git('-C', repo, 'remote', 'add', 'origin', remote);
  git('-C', repo, 'push', '-q', '-u', 'origin', 'main');
  writeFileSync(path.join(repo, 'b.txt'), '2');
  git('-C', repo, 'add', '.');
  git('-C', repo, 'commit', '-q', '-m', 'segundo');
  writeFileSync(path.join(repo, 'a.txt'), 'guardado');
  git('-C', repo, 'stash', 'push', '-q');
  writeFileSync(path.join(repo, 'a.txt'), 'modificado');
  writeFileSync(path.join(repo, 'c.txt'), 'novo');

  // Histórico da conversa: a resposta msg_1 aparece em duas linhas (conta uma vez)
  // e a última linha ainda está incompleta (deve ser ignorada até terminar).
  const transcript = path.join(work, 'sessao.jsonl');
  const assistant = (id, usage) => JSON.stringify({ type: 'assistant', message: { id, role: 'assistant', usage } });
  writeFileSync(
    transcript,
    [
      JSON.stringify({ type: 'user', message: { role: 'user', content: 'oi' } }),
      assistant('msg_1', { input_tokens: 10, cache_creation_input_tokens: 1000, cache_read_input_tokens: 5000, output_tokens: 150 }),
      assistant('msg_1', { input_tokens: 10, cache_creation_input_tokens: 1000, cache_read_input_tokens: 5000, output_tokens: 200 }),
      assistant('msg_2', { input_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 6000, output_tokens: 300 }),
    ].join('\n') + '\n{"type":"assistant","mess',
  );

  // Snapshot de CPU antigo, para a leitura de CPU aparecer já na primeira execução.
  const cpuCache = path.join(os.tmpdir(), 'claude-statusline-cpu.json');
  const cur = os.cpus().reduce(
    (a, { times: t }) => ({ idle: a.idle + t.idle, total: a.total + t.user + t.nice + t.sys + t.idle + t.irq }),
    { idle: 0, total: 0 },
  );
  writeFileSync(cpuCache, JSON.stringify({ idle: cur.idle - 3000, total: cur.total - 4000, at: Date.now() - 30000 }));

  // Dados do Windows já coletados: bateria, velocidade da RAM, dois discos e uso da GPU.
  const windowsCache = path.join(os.tmpdir(), 'claude-statusline-windows.json');
  if (WINDOWS) {
    writeFileSync(windowsCache, JSON.stringify({
      at: Date.now(),
      battery: { pct: 76, status: 2 },
      ramMhz: 2400,
      disks: [{ id: 'C:', free: 13.2 * GB, size: 118.2 * GB }, { id: 'D:', free: 864.4 * GB, size: 931.5 * GB }],
      gpuTimes: {},
      gpu: 37,
    }));
  }

  const full = {
    session_name: 'meu-projeto',
    transcript_path: transcript,
    version: '2.1.270',
    model: { display_name: 'Opus' },
    effort: { level: 'xhigh' },
    fast_mode: true,
    vim: { mode: 'NORMAL' },
    agent: { name: 'revisor' },
    workspace: { current_dir: repo, repo: { host: 'github.com', owner: 'dono', name: 'projeto' } },
    context_window: {
      used_percentage: 32,
      context_window_size: 200000,
      current_usage: { input_tokens: 8500, output_tokens: 1200, cache_creation_input_tokens: 5000, cache_read_input_tokens: 50500 },
    },
    rate_limits: {
      five_hour: { used_percentage: 23.5, resets_at: nowSec() + 2 * 3600 + 13 * 60 + 30 },
      seven_day: { used_percentage: 81.2, resets_at: nowSec() + 3 * 86400 + 4 * 3600 + 30 },
    },
    cost: { total_cost_usd: 1.234, total_duration_ms: 3900000, total_lines_added: 156, total_lines_removed: 23 },
    prompt_cache: { warm: true, expires_at: nowSec() + 42 * 60 + 30, hit_ratio: 0.91 },
    pr: { number: 1234, url: 'https://github.com/dono/projeto/pull/1234', review_state: 'approved' },
  };

  {
    const { out, lines, all, ms } = run('statusline.mjs', full, 250);
    console.log(`--- status line completa, 250 colunas (${ms}ms)`);
    lines.forEach((l) => console.log('  ' + strip(l)));
    check(all.includes('sessão meu-projeto') && all.includes('modelo Opus · esforço xhigh'), 'sessão, modelo e esforço');
    check(all.includes('fast mode') && all.includes('vim NORMAL') && all.includes('agente revisor'), 'indicadores de modo');
    check(all.includes('repo dono/projeto') && out.includes('\x1b]8;;https://github.com/dono/projeto\x1b\\'), 'repositório clicável');
    check(all.includes('branch main · 2 alterados · ↑1 p/ enviar'), 'git: branch, alterados e à frente');
    check(/stash 1 · último commit há \d+s/.test(all), 'git: stash e último commit');
    check(all.includes('PR #1234 aprovado'), 'PR com estado');
    check(all.includes('32% · 64k de 200k'), 'contexto em números');
    check(all.includes('limite 5h 24% · renova em 2h13m') && all.includes('limite semanal 81% · renova em 3d04h'), 'renovação dos limites');
    check(all.includes('cache ● ativo · expira em 42m · acerto 91%'), 'cache: tempo e taxa de acerto');
    check(all.includes('tokens da sessão 12k entrada · 500 saída'), 'tokens da sessão sem duplicar respostas');
    check(all.includes('custo $1,23 · $1,14/h') && all.includes('linhas +156 -23 · 165/h'), 'custo e linhas por hora');
    check(all.includes('duração 1h05m') && /\S{3} \d{2}\/\d{2} \d{2}:\d{2}/.test(all), 'data e duração');
    check(all.includes('projeto meu-app v1.2.3') && /node v\d+/.test(all), 'versão do projeto e do Node');
    check(all.includes('claude v2.1.270'), 'versão do Claude Code');
    check(!all.includes('°C'), 'sem temperatura');
    if (WINDOWS) {
      check(/cpu \d+% · gpu 37% · ram \d+,\d\/\d+,\d GB \d+% · 2400 MHz/.test(all), 'CPU, GPU, RAM em GB e velocidade da RAM');
      check(all.includes('discos C: 13/118 GB livres · D: 864/932 GB livres'), 'todos os discos');
      check(all.includes('bateria 76% na tomada') && !all.includes(' Hz'), 'bateria, sem taxa de atualização da tela');
    } else {
      check(/cpu \d+% · ram \d+,\d\/\d+,\d GB \d+%/.test(all) && /discos \d+(,\d)?\/\d+ GB livres/.test(all), 'CPU, RAM e disco');
    }
    const saved = JSON.parse(readFileSync(cpuCache, 'utf8'));
    check(typeof saved.at === 'number' && typeof saved.pct === 'number', 'amostra de CPU salva com horário e valor');
  }

  {
    appendFileSync(
      transcript,
      'age":{"id":"msg_3","role":"assistant","usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":8000,"output_tokens":1500}}}\n',
    );
    const { all } = run('statusline.mjs', full, 250);
    check(all.includes('tokens da sessão 20k entrada · 2k saída'), 'tokens da sessão somam só o trecho novo');
  }

  {
    const narrow = run('statusline.mjs', full, 100);
    const wide = run('statusline.mjs', full, 250);
    console.log(`--- mesma status line em 100 colunas (${narrow.ms}ms)`);
    narrow.lines.forEach((l) => console.log('  ' + strip(l)));
    check(narrow.lines.every((l) => visibleLength(l) <= 96), 'nenhuma linha passa da largura (100 colunas)');
    check(narrow.lines.length > wide.lines.length, 'terminal mais largo usa menos linhas');
    check(wide.lines.slice(-3).map((l) => [...strip(l)].slice(-9).join('')).join('/') === ' ▐▛███▜▌ /▝▜█████▛▘/  ▘▘ ▝▝  ', 'bonequinho no canto inferior direito');
  }

  {
    const { lines, all, ms } = run('statusline.mjs', BOM + JSON.stringify({
      model: { display_name: 'Opus' },
      cwd: os.homedir(),
      context_window: { used_percentage: null, current_usage: null },
    }));
    console.log(`--- status line mínima, entrada com BOM (${ms}ms)`);
    lines.forEach((l) => console.log('  ' + strip(l)));
    check(all.startsWith(`modelo Opus │ pasta ${path.basename(os.homedir())}`), 'modelo e pasta sem git');
    check(/contexto \S+ 0%/.test(all) && !all.includes('custo') && !all.includes('limite') && !all.includes('tokens'), 'sem dados ausentes');
  }

  {
    const { all } = run('statusline.mjs', { model: { display_name: 'Opus' }, cwd: os.homedir(), pr: { number: 7, review_state: 'changes_requested' } });
    check(all.includes('PR #7 alterações pedidas'), 'PR com alterações pedidas');
  }

  {
    const pyDir = path.join(work, 'app-python');
    mkdirSync(pyDir);
    writeFileSync(path.join(pyDir, 'requirements.txt'), '');
    const hasPython = spawnSync('python', ['--version'], { encoding: 'utf8' }).status === 0;
    const { all } = run('statusline.mjs', { model: { display_name: 'Opus' }, cwd: pyDir });
    if (hasPython) check(/python \d+\.\d+/.test(all), 'versão do Python em projeto Python');
    else console.log('PULADO python não instalado');
  }

  if (WINDOWS) {
    // Dados vencidos: a barra consulta o Windows de novo.
    writeFileSync(windowsCache, JSON.stringify({ at: Date.now() - 120000, battery: { pct: 50, status: 1 }, ramMhz: 1, disks: [], gpuTimes: {}, gpu: null }));
    const { all, ms } = run('statusline.mjs', { model: { display_name: 'Opus' }, cwd: os.homedir() });
    const refreshed = JSON.parse(readFileSync(windowsCache, 'utf8'));
    const fresh = Date.now() - refreshed.at < 15000;
    check(fresh && refreshed.disks.length > 0 && all.includes(`discos ${refreshed.disks[0].id}`), `Windows consultado de novo quando os dados vencem (${ms}ms)`);
    if (fresh && refreshed.battery) check(all.includes(`bateria ${refreshed.battery.pct}%`), `bateria real: ${refreshed.battery.pct}%`);
    if (fresh && refreshed.ramMhz) check(all.includes(`${refreshed.ramMhz} MHz`), `velocidade real da RAM: ${refreshed.ramMhz} MHz`);

    // Uso da GPU pela diferença entre leituras: simula 25% de uso nos últimos 30 segundos.
    const luids = Object.keys(refreshed.gpuTimes);
    if (luids.length) {
      const earlier = Object.fromEntries(luids.map((luid) => [luid, refreshed.gpuTimes[luid] - 30000 * 1e4 * 0.25]));
      writeFileSync(windowsCache, JSON.stringify({ ...refreshed, at: Date.now() - 30000, gpuTimes: earlier, gpu: null }));
      const { all: withGpu } = run('statusline.mjs', { model: { display_name: 'Opus' }, cwd: os.homedir() });
      const gpu = Number(/gpu (\d+)%/.exec(withGpu)?.[1]);
      check(gpu >= 24 && gpu <= 35, `uso da GPU calculado pela diferença entre leituras (${gpu}%)`);
    } else {
      console.log('PULADO nenhuma GPU com contador de uso');
    }
  }

  {
    const columns = 60;
    const { lines, ms } = run('subagent-statusline.mjs', {
      columns,
      tasks: [
        {
          id: 't1', name: 'revisor', status: 'running', model: 'claude-sonnet-5', effort: 'high',
          tokenCount: 42000, contextWindowSize: 200000, startTime: Date.now() - 80000,
          description: 'Revisando as mudancas do modulo de autenticacao inteiro',
        },
        {
          id: 't2', name: 'explorador', status: 'completed', model: 'claude-haiku-4-5-20251001',
          tokenCount: 1200000, startTime: new Date(Date.now() - 5000).toISOString(),
        },
        { name: 'sem-id' },
      ],
    });
    const rows = lines.map((l) => JSON.parse(l));
    console.log(`--- subagentes, ${columns} colunas (${ms}ms)`);
    rows.forEach((r) => console.log(`  [${r.id}] ${strip(r.content)}  (${visibleLength(r.content)} col)`));
    check(rows.length === 2 && rows.every((r) => r.id), 'um JSON com id por task válida');
    check(rows.every((r) => visibleLength(r.content) <= columns), `cabe em ${columns} colunas`);
    check(strip(rows[1].content).includes('haiku-4-5 · 1,2M tok'), 'modelo encurtado e tokens em milhões');
  }

  {
    const { out } = run('subagent-statusline.mjs', '{}');
    check(out === '', 'entrada vazia não imprime nada');
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log(ok ? '\nTODOS OS TESTES PASSARAM' : '\nHOUVE FALHAS');
process.exit(ok ? 0 : 1);
