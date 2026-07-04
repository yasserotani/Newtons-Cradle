export class AudioManager {
  constructor() {
    this.enabled = true; // Set to true to allow sounds
    // Initialize the browser's built-in audio engine
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  playCollision() {
    if (!this.enabled) return;

    // Browsers suspend audio until user interaction; this wakes it up
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    // Create the sound generator (Oscillator) and volume controller (Gain)
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    // 1. Shape the Pitch (Frequency)
    // Starts sharp at 400Hz and drops exponentially to 100Hz in 0.1 seconds
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);

    // 2. Shape the Volume (Envelope)
    // Starts at 50% volume and fades out exponentially to near-zero in 0.1 seconds
    gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    // 3. Connect the nodes to the destination (your speakers)
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    // 4. Play and destroy
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + 0.1);
  }

  // New method to toggle sound
  toggleMute() {
    this.enabled = !this.enabled;
  }

  // New method to check if sound is enabled
  isEnabled() {
    return this.enabled;
  }
}