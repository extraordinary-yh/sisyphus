// Original modal/FM metal strikes. Positive cues have no noise sweep or pre-impact whoosh.
export type ForgeCue = "impact" | "fracture" | "promotion" | "demotion" | "finish";

/** One shared stereo room per player; the master sits after the room so mute stops tails. */
export function createForgeMix(ctx: BaseAudioContext, destination: AudioNode) {
  const input = ctx.createGain(), master = ctx.createGain();
  const room = ctx.createConvolver(), wet = ctx.createGain(), dry = ctx.createGain();
  const highpass = ctx.createBiquadFilter(), lowpass = ctx.createBiquadFilter();
  const impulse = ctx.createBuffer(2, Math.ceil(ctx.sampleRate * 1.45), ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel); let seed = 137 + channel * 827;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 16807) % 2147483647;
      const seconds = i / ctx.sampleRate;
      data[i] = seconds < .024 ? 0 : (seed / 1073741824 - 1) * Math.exp(-seconds * 5.7);
    }
  }
  room.buffer = impulse;
  highpass.type = "highpass"; highpass.frequency.value = 620;
  lowpass.type = "lowpass"; lowpass.frequency.value = 6800;
  dry.gain.value = .92; wet.gain.value = .24; master.gain.value = .8;
  input.connect(dry); dry.connect(master);
  input.connect(room); room.connect(highpass); highpass.connect(lowpass); lowpass.connect(wet); wet.connect(master);
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 8; limiter.ratio.value = 8;
  limiter.attack.value = .001; limiter.release.value = .18;
  // Add density after compression, with a bounded soft clipper rather than digital clipping.
  const presence = ctx.createWaveShaper(), curve = new Float32Array(4097);
  for (let i = 0; i < curve.length; i++) curve[i] = .92 * Math.tanh(2.6 * (i * 2 / (curve.length - 1) - 1));
  presence.curve = curve; presence.oversample = "4x";
  master.connect(limiter); limiter.connect(presence); presence.connect(destination);
  return { input, master };
}

export function synthesizeCue(ctx: BaseAudioContext, output: AudioNode, cue: ForgeCue) {
  const t = ctx.currentTime + .008;
  const note = (hz: number, offset: number, length: number, level: number, endHz = hz, pan = 0, metal = 0, hold = false) => {
    const oscillator = ctx.createOscillator(), envelope = ctx.createGain(), stereo = ctx.createStereoPanner();
    oscillator.type = "sine"; stereo.pan.value = pan;
    oscillator.frequency.setValueAtTime(hz, t + offset);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), t + offset + length);
    envelope.gain.setValueAtTime(.0001, t + offset);
    envelope.gain.exponentialRampToValueAtTime(level, t + offset + .0015);
    envelope.gain.exponentialRampToValueAtTime(level * (hold ? .95 : .65), t + offset + (hold ? .055 : .035));
    envelope.gain.exponentialRampToValueAtTime(level * (hold ? .5 : .28), t + offset + Math.min(hold ? .3 : .22, length * .45));
    envelope.gain.exponentialRampToValueAtTime(.0001, t + offset + length);
    // Inharmonic FM at the attack makes a struck plate, then resolves into a ringing tone.
    let modulator: OscillatorNode | undefined, depth: GainNode | undefined;
    if (metal) {
      modulator = ctx.createOscillator(); depth = ctx.createGain();
      modulator.frequency.value = hz * 2.756;
      depth.gain.setValueAtTime(hz * metal, t + offset);
      depth.gain.exponentialRampToValueAtTime(hz * .025, t + offset + Math.min(.32, length));
      modulator.connect(depth); depth.connect(oscillator.frequency);
      modulator.start(t + offset); modulator.stop(t + offset + length + .03);
      modulator.onended = () => { modulator?.disconnect(); depth?.disconnect(); };
    }
    oscillator.connect(envelope); envelope.connect(stereo); stereo.connect(output);
    oscillator.start(t + offset); oscillator.stop(t + offset + length + .03);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); stereo.disconnect(); };
  };
  if (cue === "impact") {
    // All force begins at contact: a bright clang, wide overtones, then a major victory flourish.
    const partials = [587.33, 939.73, 1481, 2354, 3515, 5017];
    const decays = [1.65, 1.32, 1.06, .78, .5, .3];
    const levels = [.72, .5, .38, .29, .2, .12];
    partials.forEach((hz, i) => note(hz, i * .0006, decays[i], levels[i], hz * .999,
      (i % 2 ? 1 : -1) * .18, i === 0 ? 3.8 : 1.2, true));
    note(196, 0, .45, .4, 196, 0, 2.1, true);
    note(293.66, 0, .62, .32, 293.66, 0, 1.7, true);
    [880, 1174.66, 1479.98, 2349.32].forEach((hz, i) =>
      note(hz, .055 + i * .052, 1.3 - i * .15, .16 - i * .025, hz, (i % 2 ? .4 : -.4), .4, true));
    return;
  }
  if (cue === "fracture") {
    [456, 813, 1397, 2469, 3891].forEach((hz, i) =>
      note(hz, i*.006, .85-i*.12, .17/(1+i*.55), hz*.69, (i%2 ? .25 : -.25), 1.6));
    return;
  }
  if (cue === "demotion") {
    [293.66, 349.23, 440].forEach((hz, i) => note(hz, i*.09, 1.5, .095, hz*.75, (i-1)*.25, .55));
    return;
  }
  const notes = cue === "promotion" ? [293.66, 440, 587.33, 739.99, 880, 1174.66] : [587.33, 739.99, 880];
  notes.forEach((hz, i) => {
    note(hz, i*.075, 1.65, .13, hz, (i%2 ? .3 : -.3), .55);
    note(hz*2.003, i*.075, .85, .036, hz*2, (i%2 ? -.4 : .4));
  });
}
export class ForgeAudio {
  private context: AudioContext | null = null;
  private input: GainNode | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  async unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      const mix = createForgeMix(this.context, this.context.destination);
      this.input = mix.input; this.master = mix.master; this.master.gain.value = this.enabled ? .8 : 0;
    }
    if (this.context.state === "suspended") await this.context.resume();
    return this.context.state === "running";
  }
  setEnabled(value: boolean) {
    this.enabled = value;
    if (this.master && this.context) this.master.gain.setTargetAtTime(value ? .8 : 0, this.context.currentTime, .012);
  }
  play(cue: ForgeCue) {
    if (this.enabled && this.context?.state === "running" && this.input) synthesizeCue(this.context, this.input, cue);
  }
  dispose() { void this.context?.close(); this.context = null; this.input = null; this.master = null; }
}
