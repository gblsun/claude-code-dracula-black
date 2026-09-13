// Gera o toque de "tarefa concluída": um arpejo curto de sino em Dó maior, em WAV.
// Uso: node gerar-toque.mjs [arquivo.wav]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const output = process.argv[2] ?? fileURLToPath(new URL('./tarefa-concluida.wav', import.meta.url));
const RATE = 44100;
const samples = new Float64Array(Math.round(RATE * 1.4));

// Dó5, Mi5, Sol5 e Dó6, com 95 ms entre as notas; a última soa mais forte.
const notes = [523.25, 659.25, 783.99, 1046.5];
notes.forEach((freq, n) => {
  const start = Math.round(n * 0.095 * RATE);
  const volume = n === notes.length - 1 ? 1 : 0.75;
  for (let i = start; i < samples.length; i++) {
    const t = (i - start) / RATE;
    const attack = Math.min(1, t / 0.004);
    // Timbre de sino: fundamental mais parciais levemente inarmônicos que somem antes.
    const tone =
      Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4.2) +
      0.35 * Math.sin(2 * Math.PI * freq * 2.01 * t) * Math.exp(-t * 7) +
      0.12 * Math.sin(2 * Math.PI * freq * 3.02 * t) * Math.exp(-t * 11);
    samples[i] += volume * attack * tone;
  }
});

// Normaliza para -3 dB e termina com um fade-out curto para não estalar.
const peak = samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
const gain = 0.708 / peak;
const fadeStart = samples.length - Math.round(0.08 * RATE);

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
