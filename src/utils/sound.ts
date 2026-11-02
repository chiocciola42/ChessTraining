/**
 * Audio synthesis for Chess Academy using Web Audio API.
 * Guarantees zero network latency, offline support, and natural acoustics.
 */

interface ToneSpec {
  type: OscillatorType;
  /** Start frequency in Hz. */
  freq: number;
  /** Optional end frequency: the pitch glides there exponentially. */
  endFreq?: number;
  /** Peak gain. */
  volume: number;
  /** Duration in seconds. */
  duration: number;
  /** Start offset in seconds from "now". */
  delay?: number;
}

class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled = true;

  /** Lazily creates the AudioContext (must follow a user gesture). */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn('AudioContext resume failed', e));
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** Plays a sequence of tones; the single place where oscillators are wired up. */
  private play(tones: ReadonlyArray<ToneSpec>) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (const tone of tones) {
      const start = now + (tone.delay ?? 0);
      const end = start + tone.duration;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(tone.endFreq, end);
      }
      gain.gain.setValueAtTime(tone.volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    }
  }

  // Soft wood thud for normal move
  public playMove() {
    this.play([{ type: 'triangle', freq: 140, endFreq: 45, volume: 0.3, duration: 0.09 }]);
  }

  // Crisp sharp clack for capture
  public playCapture() {
    this.play([{ type: 'sawtooth', freq: 320, endFreq: 80, volume: 0.4, duration: 0.12 }]);
  }

  // Check alert chime
  public playCheck() {
    this.play([
      { type: 'sine', freq: 520, volume: 0.25, duration: 0.2 },
      { type: 'sine', freq: 780, volume: 0.25, duration: 0.2, delay: 0.07 },
    ]);
  }

  // Pleasant win chime (A major arpeggio)
  public playVictory() {
    this.play(
      [440, 554.37, 659.25, 880].map((freq, idx) => ({
        type: 'triangle' as const,
        freq,
        volume: 0.3,
        duration: 0.4,
        delay: idx * 0.12,
      }))
    );
  }

  // Gentle notification tone for exercise success (C5 to E5)
  public playSuccess() {
    this.play(
      [523.25, 659.25].map((freq, idx) => ({
        type: 'sine' as const,
        freq,
        volume: 0.2,
        duration: 0.25,
        delay: idx * 0.08,
      }))
    );
  }

  // Soft low tone for mistake
  public playError() {
    this.play([{ type: 'sawtooth', freq: 160, endFreq: 110, volume: 0.2, duration: 0.2 }]);
  }
}

export const sound = new SoundEffects();
