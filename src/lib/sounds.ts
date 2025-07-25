// Sound notification utilities for chat messages

class SoundNotifications {
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings();
    }
  }

  private loadSettings() {
    if (typeof window === "undefined") return;

    try {
      const savedSettings = localStorage.getItem("nexuschat-settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.soundEnabled = settings.notifications?.sound ?? true;
      }
    } catch (error) {
      console.error("Error loading sound settings:", error);
    }
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }

    // Resume context if it's suspended (required for user interaction)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  private async playTone(
    frequency: number,
    duration: number,
    volume: number = 0.1
  ) {
    if (!this.soundEnabled) return;

    try {
      await this.initAudioContext();
      if (!this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error("Error playing notification sound:", error);
    }
  }

  async playMessageNotification() {
    // Play a pleasant notification sound (two-tone chime)
    await this.playTone(800, 0.15, 0.1);
    setTimeout(async () => {
      await this.playTone(600, 0.15, 0.08);
    }, 100);
  }

  async playTypingSound() {
    // Subtle typing sound
    await this.playTone(1000, 0.05, 0.02);
  }

  updateSettings(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  // Test method for settings page
  async testNotificationSound() {
    await this.playMessageNotification();
  }
}

// Create singleton instance
export const soundNotifications = new SoundNotifications();

// Utility functions
export const playMessageSound = () =>
  soundNotifications.playMessageNotification();
export const playTypingSound = () => soundNotifications.playTypingSound();
export const updateSoundSettings = (enabled: boolean) =>
  soundNotifications.updateSettings(enabled);
export const testNotificationSound = () =>
  soundNotifications.testNotificationSound();
