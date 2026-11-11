// SoundEngine - Local Offline Web Audio Synthesizer for TEMPO
const SoundEngine = {
  presets: [
    {
      id: 'tempo_chime',
      name: 'Tempo Chime',
      tag: 'Default',
      desc: 'Kristal modern dengan akor 3 nada naik yang elegan, bersih, dan menenangkan.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const notes = [880, 1108.7, 1318.5]; // A5, C#6, E6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);

          gain.gain.setValueAtTime(0.0001, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.25 * vol, now + i * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.38);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.42);
        });
      }
    },
    {
      id: 'radar_pulse',
      name: 'Radar Pulse',
      tag: 'Cyber / Sci-Fi',
      desc: 'Sonar radar dua nada turun yang futuristik dan khas perangkat taktikal.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const sweeps = [
          { start: 1760, end: 880, time: 0 },
          { start: 2200, end: 1100, time: 0.18 }
        ];
        sweeps.forEach(s => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(s.start, now + s.time);
          osc.frequency.exponentialRampToValueAtTime(s.end, now + s.time + 0.14);

          gain.gain.setValueAtTime(0.0001, now + s.time);
          gain.gain.linearRampToValueAtTime(0.3 * vol, now + s.time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + s.time + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + s.time);
          osc.stop(now + s.time + 0.25);
        });
      }
    },
    {
      id: 'digital_retro',
      name: 'Digital Retro',
      tag: 'Casio 80s',
      desc: 'Bunyi bip-bip ganda arloji digital klasik yang tajam dan nostalgia.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const beeps = [0, 0.09, 0.22, 0.31];
        beeps.forEach(t => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2048, now + t);

          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.linearRampToValueAtTime(0.18 * vol, now + t + 0.008);
          gain.gain.setValueAtTime(0.18 * vol, now + t + 0.055);
          gain.gain.linearRampToValueAtTime(0.0001, now + t + 0.065);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + 0.075);
        });
      }
    },
    {
      id: 'marimba',
      name: 'Warm Marimba',
      tag: 'Akustik Lembut',
      desc: 'Melodi kayu pentatonik yang santai, ramah di telinga, dan tidak mengejutkan.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);

          gain.gain.setValueAtTime(0.0001, now + i * 0.1);
          gain.gain.linearRampToValueAtTime(0.35 * vol, now + i * 0.1 + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.32);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.35);
        });
      }
    },
    {
      id: 'siren_alarm',
      name: 'Siren Alarm',
      tag: 'Darurat Ekstrem',
      desc: 'Sirine bergetar cepat dengan modulasi tajam, mustahil diabaikan saat fokus.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1300, now + 0.15);
        osc.frequency.linearRampToValueAtTime(800, now + 0.3);
        osc.frequency.linearRampToValueAtTime(1300, now + 0.45);
        osc.frequency.linearRampToValueAtTime(800, now + 0.6);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.22 * vol, now + 0.03);
        gain.gain.setValueAtTime(0.22 * vol, now + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.68);
      }
    },
    {
      id: 'zen_bell',
      name: 'Zen Singing Bowl',
      tag: 'Gong 432Hz',
      desc: 'Dentang mangkuk meditasi 432Hz yang bergaung lama, menenangkan dan fokus.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const freqs = [432, 864, 1296];
        const amps = [0.4, 0.2, 0.08];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(amps[idx] * vol, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.85);
        });
      }
    },
    {
      id: 'space_drop',
      name: 'Space Ping',
      tag: 'Arcade Laser',
      desc: 'Efek laser sci-fi dengan drop frekuensi tajam dan pantulan aksen teknologi.',
      play: (ctx, vol) => {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1600, now);
        osc1.frequency.exponentialRampToValueAtTime(350, now + 0.2);

        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.linearRampToValueAtTime(0.35 * vol, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.28);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1400, now + 0.16);

        gain2.gain.setValueAtTime(0.0001, now + 0.16);
        gain2.gain.linearRampToValueAtTime(0.2 * vol, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.16);
        osc2.stop(now + 0.48);
      }
    }
  ],

  audioCtx: null,

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playSound(presetId = 'tempo_chime', volume = 0.8) {
    try {
      const ctx = this.getAudioContext();
      const preset = this.presets.find(p => p.id === presetId) || this.presets[0];
      const safeVol = Math.max(0.1, Math.min(1.0, Number(volume) || 0.8));
      preset.play(ctx, safeVol);
    } catch (err) {
      console.error('[SoundEngine] Play error:', err);
    }
  }
};

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}
