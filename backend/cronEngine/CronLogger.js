const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CronLogger {
  constructor(simId) {
    this.simId = simId;
    this.prefix = `[CronEngine:${simId}]`;
  }

  info(msg) {
    console.log(`✅ ${this.prefix} ${new Date().toISOString()} - ${msg}`);
  }

  warn(msg) {
    console.warn(`⚠️ ${this.prefix} ${new Date().toISOString()} - ${msg}`);
  }

  error(msg) {
    console.error(`❌ ${this.prefix} ${new Date().toISOString()} - ${msg}`);
  }

  async logSuccess(job, campaignId) {
    this.info(`Sent to ${job.number} (${job.name})`);
    
    await prisma.messageLog.create({
      data: {
        simId: this.simId,
        campaignId,
        recipientNumber: job.number,
        recipientName: job.name || '',
        status: 'sent',
        sentAt: new Date()
      }
    }).catch(e => this.error(`Log failed: ${e.message}`));

    // Update campaign progress
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalSent: { increment: 1 } }
    }).catch(() => {});
  }

  async logFailure(job, campaignId, reason) {
    this.error(`Failed: ${job.number} - ${reason}`);

    await prisma.messageLog.create({
      data: {
        simId: this.simId,
        campaignId,
        recipientNumber: job.number,
        recipientName: job.name || '',
        status: 'failed',
        failReason: reason,
        sentAt: new Date()
      }
    }).catch(() => {});

    // Update campaign progress
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalFailed: { increment: 1 } }
    }).catch(() => {});
  }
}

module.exports = { CronLogger };
