// Paleta Dracula e utilitários compartilhados pelos scripts de status line.

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export const rgb = (hex) => `\x1b[38;2;${toRgb(hex).join(';')}m`;
export const RESET = '\x1b[0m';
export const ACCENT = rgb('#bd93f9'); // roxo
export const INFO = rgb('#8be9fd'); // ciano
export const HIGHLIGHT = rgb('#ff79c6'); // rosa
export const WARN = rgb('#ffb86c'); // laranja
export const CAUTION = rgb('#f1fa8c'); // amarelo
export const MUTED = rgb('#6272a4'); // cinza-azulado
export const LABEL = rgb('#a4acd4'); // lavanda, para rótulos
export const STRONG = rgb('#f8f8f2'); // quase branco, para valores

// Cores por faixa sem depender de vermelho/verde (amigável para daltonismo).
export const levelColor = (pct) => (pct < 50 ? INFO : pct < 80 ? CAUTION : WARN);

// Barra de progresso: blocos cheios na cor da faixa, vazios em cinza.
export const bar = (pct, width) => {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return `${levelColor(pct)}${'█'.repeat(filled)}${MUTED}${'░'.repeat(width - filled)}`;
};

// Link clicável (OSC 8), suportado pelo Windows Terminal.
const LINK_END = '\x1b]8;;\x1b\\';
export const link = (url, text) => `\x1b]8;;${url}\x1b\\${text}${LINK_END}`;

export const readStdinJson = async () => {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(text.trim() || '{}');
};

export const formatDuration = (ms) => {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h${String(m % 60).padStart(2, '0')}m`;
  return `${Math.floor(h / 24)}d${String(h % 24).padStart(2, '0')}h`;
};

// Tempo que falta até um instante em segundos Unix (resets_at, expires_at).
export const untilEpoch = (epochSeconds) => formatDuration(Math.max(0, epochSeconds * 1000 - Date.now()));

// Número com vírgula decimal (pt-BR), sem carregar dados de localização.
export const decimal = (value, digits = 2) => value.toFixed(digits).replace('.', ',');

const compact = (value) => String(+value.toFixed(1)).replace('.', ',');

export const shortTokens = (n) => {
  if (n >= 1e6) return `${compact(n / 1e6)}M`;
  if (n >= 1e4) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${compact(n / 1000)}k`;
  return String(n);
};

// Sequências de cor (CSI ... m) e de link (OSC 8) não ocupam colunas.
const ESCAPES = /(\x1b\[[0-9;]*m|\x1b\]8;;[^\x1b]*\x1b\\)/;

export const visibleLength = (s) =>
  s.split(ESCAPES).reduce((n, part) => (part.startsWith('\x1b') ? n : n + [...part].length), 0);

// Corta o texto em `max` colunas visíveis, preservando as sequências de escape.
export const truncate = (s, max) => {
  if (visibleLength(s) <= max) return s;
  let out = '';
  let used = 0;
  for (const part of s.split(ESCAPES)) {
    if (part.startsWith('\x1b')) {
      out += part;
      continue;
    }
    for (const ch of part) {
      if (used >= max - 1) return `${out}…${LINK_END}${RESET}`;
      out += ch;
      used++;
    }
  }
  return out;
};

// Distribui os segmentos, na ordem, em linhas que cabem na largura.
export const packLines = (segments, width, separator) => {
  const sepLength = visibleLength(separator);
  const lines = [];
  let current = [];
  let used = 0;
  for (const raw of segments) {
    const segment = truncate(raw, width);
    const length = visibleLength(segment);
    if (current.length && used + sepLength + length > width) {
      lines.push(current);
      current = [];
      used = 0;
    }
    used += (current.length ? sepLength : 0) + length;
    current.push(segment);
  }
  if (current.length) lines.push(current);
  return lines.map((line) => line.join(separator));
};
