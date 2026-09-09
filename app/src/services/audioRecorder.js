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

        const base64 = await blobToBase64(audioBlob);
        resolve({
          blob: audioBlob,
          base64,
          mimeType,
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
