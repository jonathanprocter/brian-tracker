// Celebration sound using Web Audio API - no external files needed
export function playCelebrationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant chime/success sound
    const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Play a pleasant ascending chime (C5 - E5 - G5)
    playTone(523.25, 0, 0.3, 0.15);      // C5
    playTone(659.25, 0.1, 0.3, 0.12);    // E5
    playTone(783.99, 0.2, 0.4, 0.1);     // G5
    
  } catch (e) {
    // Silently fail if audio is not supported
    console.log('Audio not supported');
  }
}

// Level up sound - more celebratory
export function playLevelUpSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Fanfare-like ascending pattern
    playTone(523.25, 0, 0.2, 0.15);      // C5
    playTone(659.25, 0.1, 0.2, 0.15);    // E5
    playTone(783.99, 0.2, 0.2, 0.15);    // G5
    playTone(1046.50, 0.3, 0.5, 0.12);   // C6 (octave higher)
    
  } catch (e) {
    console.log('Audio not supported');
  }
}

// Haptic feedback using Vibration API
export function triggerHapticFeedback(pattern: 'success' | 'levelUp' = 'success') {
  try {
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      if (pattern === 'levelUp') {
        // Longer, more celebratory pattern for level up
        navigator.vibrate([50, 50, 50, 50, 100]);
      } else {
        // Short, subtle vibration for task completion
        navigator.vibrate([30, 30, 50]);
      }
    }
  } catch (e) {
    // Silently fail if vibration is not supported
    console.log('Vibration not supported');
  }
}
