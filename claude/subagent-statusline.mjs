// Linha personalizada de cada subagente no painel abaixo do prompt (paleta Dracula).
// Recebe { columns, tasks[] } via stdin e imprime um JSON {id, content} por linha.
import {
  RESET, PURPLE, CYAN, ORANGE, COMMENT, FG,
  bar, readStdinJson, formatDuration, shortTokens, truncate,
} from './dracula-colors.mjs';

const { columns = 80, tasks = [] } = await readStdinJson();

const statusColor = (status = '') => {
  if (/fail|error|kill|cancel|stop/i.test(status)) return ORANGE;
  if (/complete|done|finish|success/i.test(status)) return COMMENT;
  return CYAN;
};

const shortModel = (id) => id?.replace(/^claude-/, '').replace(/-\d{8}$/, '');

const startedAt = (t) => {
  if (typeof t === 'number') return t > 1e12 ? t : t * 1000;
  const parsed = Date.parse(t);
  return Number.isNaN(parsed) ? null : parsed;
};

for (const task of tasks) {
  if (!task?.id) continue;

  const parts = [`${statusColor(task.status)}●${FG} ${task.name || task.label || task.type || 'agente'}`];

  const model = [shortModel(task.model), typeof task.effort === 'string' ? task.effort : null]
    .filter(Boolean)
    .join(' ');
  if (model) parts.push(`${PURPLE}${model}`);

  if (task.tokenCount != null) {
    const tokens = `${FG}${shortTokens(task.tokenCount)} tok`;
    parts.push(task.contextWindowSize ? `${bar((task.tokenCount / task.contextWindowSize) * 100, 5)} ${tokens}` : tokens);
  }

  const start = task.startTime != null ? startedAt(task.startTime) : null;
  if (start) parts.push(`${COMMENT}${formatDuration(Math.max(0, Date.now() - start))}`);

  if (task.description) parts.push(`${COMMENT}${task.description}`);

  const content = truncate(parts.join(`${COMMENT} · `), columns) + RESET;
  process.stdout.write(JSON.stringify({ id: task.id, content }) + '\n');
}
