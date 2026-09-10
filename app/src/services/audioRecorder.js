/**
 * Bulletproof Audio Recorder for Electron & Modern Browsers
 * Uses native MediaRecorder with WebM/Opus encoding to ensure:
 * 1. Zero sample rate mismatch or pitch distortion.
 * 2. Exact wall-clock timestamps with zero audio stretching.
 * 3. High-fidelity compressed audio ideal for Google Gemini multimodal STT.
 */

let activeStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let audioContext = null;
let analyser = null;
let animFrameId = null;
let recordStartTime = 0;

/**
 * Detect best supported audio MIME type
 */
export function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return 'audio/webm';
}

/**
 * Converts a Blob to a Base64 encoded string
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string') {
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      } else {
        reject(new Error('Failed to read blob as Base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts an audio Blob into 16kHz Mono 16-bit PCM WAV Base64 (Standard for Bhashini Dhruva ASR)
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export async function convertBlobTo16kWavBase64(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtxClass) {
      return await blobToBase64(blob);
    }

    const tempCtx = new AudioCtxClass();
    let decoded = null;
    try {
      decoded = await tempCtx.decodeAudioData(arrayBuffer);
    } finally {
      try { await tempCtx.close(); } catch (e) {}
    }

    if (!decoded) {
      return await blobToBase64(blob);
    }

    // High-fidelity resample to 16,000 Hz Mono using native OfflineAudioContext
    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(decoded.duration * targetSampleRate));
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      1,
      targetLength,
      targetSampleRate
    );

    const bufferSource = offlineCtx.createBufferSource();
    bufferSource.buffer = decoded;
    bufferSource.connect(offlineCtx.destination);
    bufferSource.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const pcmData = renderedBuffer.getChannelData(0);

    // Encode to 16-bit PCM RIFF WAV
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const dataSize = pcmData.length * bytesPerSample;
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    const writeStr = (v, off, str) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(off + i, str.charCodeAt(i));
      }
    };

    // RIFF identifier
    writeStr(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeStr(view, 8, 'WAVE');
    // fmt chunk
    writeStr(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono (1 channel)
    view.setUint32(24, targetSampleRate, true);
    view.setUint32(28, targetSampleRate * 1 * bytesPerSample, true);
    view.setUint16(32, 1 * bytesPerSample, true);
    view.setUint16(34, bitsPerSample, true);
    // data chunk
    writeStr(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, Math.round(sample), true);
      offset += 2;
    }

    // Convert ArrayBuffer to Base64
    let binary = '';
    const bytes = new Uint8Array(wavBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (err) {
    console.warn('[AudioRecorder] WAV conversion fallback to raw blob:', err);
    return await blobToBase64(blob);
  }
}

/**
 * Starts microphone recording with live audio level visualization callback
 * @param {Object} options
 * @param {function(number): void} [options.onAudioLevel] - Callback with normalized volume 0-100
 * @returns {Promise<boolean>}
 */
export async function startRecording({ onAudioLevel } = {}) {
  // Ensure any lingering stream/recording is cleaned up first
  await cleanupRecording();

  try {
    // Request microphone access with standard acoustic parameters
    activeStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const mimeType = getSupportedMimeType();
    recordedChunks = [];
    recordStartTime = Date.now();

    // Create native MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(activeStream, { mimeType });
    } catch (e) {
      console.warn('[AudioRecorder] Fallback to default MediaRecorder without explicit mimeType:', e);
      mediaRecorder = new MediaRecorder(activeStream);
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // Use Web Audio API solely for live volume metering (non-destructive)
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioContext = new AudioCtxClass();
        const source = audioContext.createMediaStreamSource(activeStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);

        if (onAudioLevel) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            onAudioLevel(normalized);
            animFrameId = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      }
    } catch (meterErr) {
      console.warn('[AudioRecorder] Audio level meter failed to initialize, continuing recording:', meterErr);
    }

    // Collect data slices every 250ms
    mediaRecorder.start(250);
    return true;
  } catch (err) {
    console.error('[AudioRecorder] Failed to start microphone recording:', err);
    await cleanupRecording();
    throw err;
  }
}

/**
 * Stops recording and returns the clean audio payload for Gemini STT
 * @returns {Promise<{ blob: Blob, base64: string, mimeType: string, durationSec: number } | null>}
 */
export function stopRecording() {
  return new Promise((resolve) => {
    const elapsedSec = recordStartTime > 0 ? (Date.now() - recordStartTime) / 1000 : 0;

    // Stop volume monitoring
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (analyser) {
      try { analyser.disconnect(); } catch (e) {}
      analyser = null;
    }

    if (audioContext) {
      try { audioContext.close(); } catch (e) {}
      audioContext = null;
    }

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      cleanupStream();
      resolve(null);
      return;
    }

    mediaRecorder.onstop = async () => {
      try {
        const mimeType = mediaRecorder.mimeType || getSupportedMimeType();
        const audioBlob = new Blob(recordedChunks, { type: mimeType });
        recordedChunks = [];
        cleanupStream();

        // If audio is under 0.4s or empty, ignore
        if (elapsedSec < 0.4 || audioBlob.size < 500) {
          resolve(null);
          return;
        }

        const base64Wav = await convertBlobTo16kWavBase64(audioBlob);
        resolve({
          blob: audioBlob,
          base64: base64Wav,
          mimeType: 'audio/wav',
          durationSec: parseFloat(elapsedSec.toFixed(2))
        });
      } catch (err) {
        console.error('[AudioRecorder] Failed to process recorded audio Blob:', err);
        cleanupStream();
        resolve(null);
      }
    };

    try {
      mediaRecorder.stop();
    } catch (e) {
      console.warn('[AudioRecorder] Error stopping mediaRecorder:', e);
      cleanupStream();
      resolve(null);
    }
  });
}

function cleanupStream() {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => {
      try { track.stop(); } catch (e) {}
    });
    activeStream = null;
  }
}

async function cleanupRecording() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (analyser) {
    try { analyser.disconnect(); } catch (e) {}
    analyser = null;
  }
  if (audioContext) {
    try { await audioContext.close(); } catch (e) {}
    audioContext = null;
  }
  cleanupStream();
  mediaRecorder = null;
  recordedChunks = [];
  recordStartTime = 0;
}
