// Resample float PCM from the AudioContext rate down to 16 kHz for Azure STT.
function resample(input, inSampleRate, outSampleRate) {
  if (inSampleRate === outSampleRate) return input;
  const ratio = inSampleRate / outSampleRate;
  const newLength = Math.round(input.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    const srcIndex = i * ratio;
    const index = Math.floor(srcIndex);
    const interpolation = srcIndex - index;
    if (index + 1 < input.length) {
      result[i] =
        input[index] * (1 - interpolation) + input[index + 1] * interpolation;
    } else {
      result[i] = input[index];
    }
  }
  return result;
}

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._targetRate = 16000;
    // Output frame size at 16 kHz (~64 ms per chunk).
    this._frameSize = 1024;
  }

  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;

    for (let i = 0; i < ch.length; i += 1) this._buffer.push(ch[i]);

    const inputNeeded = Math.ceil(this._frameSize * (sampleRate / this._targetRate));
    while (this._buffer.length >= inputNeeded) {
      const raw = new Float32Array(this._buffer.splice(0, inputNeeded));
      const frame = resample(raw, sampleRate, this._targetRate);

      let sum = 0;
      for (let i = 0; i < frame.length; i += 1) sum += frame[i] * frame[i];
      const rms = Math.sqrt(sum / frame.length);

      const pcm = new Int16Array(frame.length);
      for (let i = 0; i < frame.length; i += 1) {
        const s = Math.max(-1, Math.min(1, frame[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      this.port.postMessage({ pcm: pcm.buffer, rms }, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
