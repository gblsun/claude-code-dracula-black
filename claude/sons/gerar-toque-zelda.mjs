// Gera o toque de "tarefa concluída": recriação por síntese do jingle de segredo encontrado
// de The Legend of Zelda (Nintendo), em timbre de chiptune e volume baixo.
// Uso: node gerar-toque-zelda.mjs [arquivo.wav]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = process.argv[2] ?? fileURLToPath(new URL('./tarefa-concluida.wav', import.meta.url));
const RATE = 44100;
const VOLUME = 0.28; // pico do arquivo (1 = máximo): o jingle fica discreto
const STEP = 0.115; // segundos entre o início de cada nota

// Sol5, Fá#5, Ré#5, Lá4, Sol#4, Mi5, Sol#5 e Dó6 (a última fica soando).
const NOTES = [
  [783.99, 0.11], [739.99, 0.11], [622.25, 0.11], [440.0, 0.11],
  [415.3, 0.11], [659.25, 0.11], [830.61, 0.11], [1046.5, 0.9],
];

const samples = new Float64Array(Math.round(RATE * ((NOTES.length - 1) * STEP + 1.1)));

// Onda quadrada com banda limitada (só harmônicos ímpares abaixo de 9 kHz): som de videogame sem chiado.
const square = (freq, t) => {
  let value = 0;
  for (let k = 1; k * freq < 9000; k += 2) value += Math.sin(2 * Math.PI * k * freq * t) / k;
  return value;
};

NOTES.forEach(([freq, length], n) => {
  const last = n === NOTES.length - 1;
  const start = Math.round(n * STEP * RATE);
  const end = Math.min(samples.length, start + Math.round((length + 0.03) * RATE));
  for (let i = start; i < end; i++) {
    const t = (i - start) / RATE;
    const attack = Math.min(1, t / 0.004);
    const release = t > length ? Math.max(0, 1 - (t - length) / 0.03) : 1;
    const decay = Math.exp(-t * (last ? 2.2 : 3));
    samples[i] += square(freq, t) * attack * release * decay * (last ? 1 : 0.85);
  }
});

// Eco curto, como nos jogos de 16 bits.
const delay = Math.round(0.11 * RATE);
for (let i = samples.length - 1; i >= delay; i--) samples[i] += 0.22 * samples[i - delay];

// Normaliza para o volume escolhido e termina com um fade-out curto para não estalar.
const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
const gain = VOLUME / peak;
const fadeStart = samples.length - Math.round(0.06 * RATE);

const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF', 0, 'ascii');
wav.writeUInt32LE(36 + samples.length * 2, 4);
wav.write('WAVE', 8, 'ascii');
wav.write('fmt ', 12, 'ascii');
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); // PCM
wav.writeUInt16LE(1, 22); // mono
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36, 'ascii');
wav.writeUInt32LE(samples.length * 2, 40);
for (let i = 0; i < samples.length; i++) {
  const fade = i > fadeStart ? (samples.length - i) / (samples.length - fadeStart) : 1;
  wav.writeInt16LE(Math.round(samples[i] * gain * fade * 32767), 44 + i * 2);
}

writeFileSync(output, wav);
console.log(`Toque salvo em ${output} (${Math.round(wav.length / 1024)} KB)`);
