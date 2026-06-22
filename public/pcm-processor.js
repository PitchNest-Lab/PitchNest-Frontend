// public/pcm-processor.js
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._frameSize = 1024; // ~128ms at 16kHz — tune down to 1024 for lower latency
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) this._buffer.push(ch[i]);
    while (this._buffer.length >= this._frameSize) {
      const frame = new Float32Array(this._buffer.splice(0, this._frameSize));
      // RMS for VAD
      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
      const rms = Math.sqrt(sum / frame.length);
      // Convert to Int16 PCM
      const pcm = new Int16Array(frame.length);
      for (let i = 0; i < frame.length; i++) {
        const s = Math.max(-1, Math.min(1, frame[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage({ pcm: pcm.buffer, rms }, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);