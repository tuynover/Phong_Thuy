/**
 * BỘ TẠO ÂM THANH THẺ TRE BẰNG WEB AUDIO API
 * Tạo âm thanh lách cách gỗ (wood tap / bamboo shaker) tự nhiên, chân thực,
 * hoạt động hoàn toàn offline, 0ms latency, không phụ thuộc file âm thanh bên ngoài.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Phát tiếng gõ thẻ tre lách cách ngẫu nhiên
 */
export function playBambooClickSound(intensity = 1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Tần số gõ thẻ tre ngẫu nhiên (500Hz - 900Hz)
    const baseFreq = 550 + Math.random() * 320;

    // 2. Oscillator tạo âm thanh gỗ
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.045);

    // 3. Bandpass filter tạo chất liệu gỗ rỗng
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 1.2, now);
    filter.Q.setValueAtTime(4.5, now);

    // 4. Gain envelope với decay cực ngắn tạo tiếng 'cách' giòn
    const gainNode = ctx.createGain();
    const peakGain = Math.min(0.25 * intensity, 0.4);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    // Kết nối
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  } catch (e) {
    // Ignore audio errors if blocked by browser policy
  }
}

/**
 * Phát âm thanh quẻ xăm trồi lên phát sáng
 */
export function playStickRevealSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Âm vang ngân chuông thanh thoát
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.55); // C6

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);
  } catch (e) {
    // Ignore
  }
}

/**
 * Phát âm thanh thẻ xăm rơi/chạm mặt đất nhẹ
 */
export function playStickDropSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    // Ignore
  }
}

/**
 * Phát âm thanh chuông ngân kết quả cát tường
 */
export function playResultChimeSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [659.25, 880, 1046.5, 1318.51]; // E5, A5, C6, E6 pentatonic harmonious

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + idx * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });
  } catch (e) {
    // Ignore
  }
}
