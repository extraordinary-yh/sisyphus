// Original synthesized Foley: short steel transients, inharmonic resonances and a low body.
// Nothing is downloaded; the same audio graph can be rendered offline for inspection.
export type ForgeCue = "rise" | "impact" | "fracture" | "promotion" | "demotion" | "finish";
export function synthesizeCue(ctx: BaseAudioContext, output: AudioNode, cue: ForgeCue) {
  const t = ctx.currentTime + .008;
  const note = (hz: number, offset: number, length: number, level: number, endHz = hz) => {
    const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(hz, t + offset);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), t + offset + length);
    envelope.gain.setValueAtTime(.0001, t + offset);
    envelope.gain.exponentialRampToValueAtTime(level, t + offset + .005);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + offset + length);
    oscillator.connect(envelope); envelope.connect(output);
    oscillator.start(t + offset); oscillator.stop(t + offset + length + .03);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  };
  const noise = (length: number, level: number, from: number, to: number) => {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 137;
    for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741824 - 1; }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = "bandpass"; filter.Q.value = .7;
    filter.frequency.setValueAtTime(from, t); filter.frequency.exponentialRampToValueAtTime(to, t + length);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(level, t + Math.min(.06, length / 4));
    gain.gain.exponentialRampToValueAtTime(.0001, t + length);
    source.connect(filter); filter.connect(gain); gain.connect(output); source.start(t);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  };
  if (cue === "rise") { noise(.75, .14, 260, 3800); note(320, 0, .72, .022, 1220); return; }
  if (cue === "impact" || cue === "fracture") {
    const loss = cue === "fracture";
    noise(loss ? .14 : .035, loss ? .19 : .28, 8800, loss ? 1800 : 4500);
    note(loss ? 156 : 210, 0, .12, .055, 110);
    const partials = [1027, 2087, 3313, 4817, 6491];
    const decays = [.88, .64, .47, .32, .21];
    partials.forEach((hz, i) => note(hz * (loss ? .78 : 1), i * .0008,
      decays[i], .105 / (1 + i * .8), hz * (loss ? .64 : .999)));
    return;
  }
  if (cue === "demotion") { noise(.55, .15, 1800, 180); [196, 247, 293].forEach((hz, i) => note(hz, i*.08, 1.5, .065, hz*.5)); return; }
  const notes = cue === "promotion" ? [293.66, 369.99, 440, 587.33, 739.99] : [440, 554.37, 659.25];
  notes.forEach((hz, i) => { note(hz, i*.085, 1.55, .075); note(hz*2.003, i*.085, .7, .028); });
  if (cue === "promotion") { note(146.8, 0, .45, .055, 110); noise(.12,.075,5200,1700); }
}
export class ForgeAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain(); this.master.gain.value = this.enabled ? .6 : 0;
      const limiter = this.context.createDynamicsCompressor(); limiter.threshold.value = -12; limiter.ratio.value = 8;
      this.master.connect(limiter); limiter.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context.state === "running";
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    if (this.master && this.context) this.master.gain.setTargetAtTime(value ? .6 : 0, this.context.currentTime, .025);
  }
  play(cue: ForgeCue) {
    if (this.enabled && this.context?.state === "running" && this.master) synthesizeCue(this.context, this.master, cue);
  }
  dispose() { void this.context?.close(); this.context = null; this.master = null; }
}
