// Linha personalizada de cada subagente no painel abaixo do prompt (paleta do tema ativo).
// Recebe { columns, tasks[] } via stdin e imprime um JSON {id, content} por linha.
import {
  RESET, ACCENT, INFO, WARN, MUTED, STRONG,
  bar, readStdinJson, formatDuration, shortTokens, truncate,
} from './palette.mjs';

const { columns = 80, tasks = [] } = await readStdinJson();

const statusColor = (status = '') => {
  if (/fail|error|kill|cancel|stop/i.test(status)) return WARN;
  if (/complete|done|finish|success/i.test(status)) return MUTED;
  return INFO;
};

const shortModel = (id) => id?.replace(/^claude-/, '').replace(/-\d{8}$/, '');

const startedAt = (t) => {
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000;
  const parsed = Date.parse(t);
  return Number.isNaN(parsed) ? null : parsed;
};

for (const task of tasks) {
  if (!task?.id) continue;

  const parts = [`${statusColor(task.status)}●${STRONG} ${task.name || task.label || task.type || 'agente'}`];

  const model = [shortModel(task.model), typeof task.effort === 'string' ? task.effort : null]
    .filter(Boolean)
    .join(' ');
  if (model) parts.push(`${ACCENT}${model}`);

  if (task.tokenCount != null) {
    const tokens = `${STRONG}${shortTokens(task.tokenCount)} tok`;
    parts.push(task.contextWindowSize ? `${bar((task.tokenCount / task.contextWindowSize) * 100, 5)} ${tokens}` : tokens);
  }

  const start = task.startTime != null ? startedAt(task.startTime) : null;
  if (start) parts.push(`${MUTED}${formatDuration(Math.max(0, Date.now() - start))}`);

  if (task.description) parts.push(`${MUTED}${task.description}`);

  const content = truncate(parts.join(`${MUTED} · `), columns) + RESET;
  process.stdout.write(JSON.stringify({ id: task.id, content }) + '\n');
}
