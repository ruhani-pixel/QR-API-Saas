const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class SafetyGuard {
  constructor() {
    // Non-bypassable limits (System Defaults)
    this.LIMITS = Object.freeze({
      MAX_PER_SIM_PER_DAY: 120,
      MAX_SESSION_HOURS: 7,
      MIN_MSG_GAP_SEC: 18,
      MAX_BURST_SIZE: 15,
      MIN_BURST_BREAK_MIN: 25,
      MAX_DAILY_SESSIONS: 1,
    });
  }

  /**
   * Check if the SIM can send more messages today
   */
  async canSIMSend(simId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await prisma.messageLog.count({
      where: {
        simId: simId,
        sentAt: { gte: today },
        status: 'sent'
      }
    });

    const remaining = this.LIMITS.MAX_PER_SIM_PER_DAY - sentToday;

    return {
      canSend: remaining > 0,
      sentToday,
      remaining,
      limit: this.LIMITS.MAX_PER_SIM_PER_DAY
    };
  }

  /**
   * Check if the session has exceeded the maximum workday window
   */
  isSessionExpired(sessionStartTime) {
    const now = Date.now();
    const elapsed = now - sessionStartTime;
    const maxMs = this.LIMITS.MAX_SESSION_HOURS * 60 * 60 * 1000;
    
    return {
      expired: elapsed >= maxMs,
      elapsedHours: (elapsed / 3600000).toFixed(2),
      remainingHours: ((maxMs - elapsed) / 3600000).toFixed(2)
    };
  }

  /**
   * Validate the gap to ensure it never falls below the safety minimum
   */
  validateGap(proposedGapMs) {
    const minMs = this.LIMITS.MIN_MSG_GAP_SEC * 1000;
    if (proposedGapMs < minMs) {
      return minMs;
    }
    return proposedGapMs;
  }

  /**
   * Pre-campaign check for all selected SIMs
   */
  async preCampaignCheck(campaignData) {
    const issues = [];
    
    if (campaignData.numbers.length > 
        campaignData.selectedSIMs.length * this.LIMITS.MAX_PER_SIM_PER_DAY) {
      issues.push(`Too many numbers (${campaignData.numbers.length}) for selected SIMs (${campaignData.selectedSIMs.length}). Max allowed: ${campaignData.selectedSIMs.length * this.LIMITS.MAX_PER_SIM_PER_DAY}`);
    }
    
    for (const simId of campaignData.selectedSIMs) {
      const simStatus = await this.canSIMSend(simId);
      if (!simStatus.canSend) {
        issues.push(`SIM ${simId} has reached its daily limit (${simStatus.sentToday}/120)`);
      }
    }

    return {
      safe: issues.length === 0,
      issues
    };
  }

  getLimits() {
    return { ...this.LIMITS };
  }
}

module.exports = new SafetyGuard();
