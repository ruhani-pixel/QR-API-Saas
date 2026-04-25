const crypto = require('crypto');

class TimingEngine {
  /**
   * Cryptographic random number generator
   */
  cryptoRandom(min, max) {
    const range = max - min + 1;
    const randomBuffer = crypto.randomBytes(4);
    const randomInt = randomBuffer.readUInt32BE(0);
    return min + (randomInt % range);
  }

  /**
   * Layer 1: Message-to-Message gap
   * 20 to 35 seconds random with micro-variation
   */
  getMessageGap() {
    const baseGap = this.cryptoRandom(20, 35);
    const microVariation = this.cryptoRandom(-2, 2);
    const finalGap = Math.max(18, baseGap + microVariation);
    
    return {
      seconds: finalGap,
      ms: finalGap * 1000,
      reason: `Base: ${baseGap}s + Variation: ${microVariation}s = ${finalGap}s`
    };
  }

  /**
   * Layer 2: Burst size (number of messages before a long break)
   */
  getBurstSize() {
    return this.cryptoRandom(10, 15);
  }

  /**
   * Layer 2: Burst break duration
   * 25 to 35 minutes random
   */
  getBurstBreak() {
    const minutes = this.cryptoRandom(25, 35);
    const extraSeconds = this.cryptoRandom(0, 59);
    const totalMs = (minutes * 60 * 1000) + (extraSeconds * 1000);
    
    return {
      minutes,
      extraSeconds,
      ms: totalMs,
      display: `${minutes}m ${extraSeconds}s`
    };
  }

  /**
   * Layer 4: Typing duration simulation
   */
  getTypingDuration(messageText) {
    const charCount = messageText ? messageText.length : 50;
    const baseTyping = Math.min(charCount * 50, 8000);
    const typingMs = Math.max(2000, baseTyping);
    const variation = this.cryptoRandom(-500, 500);
    
    return Math.max(2000, Math.min(8000, typingMs + variation));
  }

  /**
   * Initial delay before starting the first message in a session
   */
  getInitialDelay() {
    const seconds = this.cryptoRandom(5, 15);
    return seconds * 1000;
  }
}

module.exports = new TimingEngine();
