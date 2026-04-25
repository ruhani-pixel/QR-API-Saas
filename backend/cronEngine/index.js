const SIMWorker = require('./JobQueue');
const safetyGuard = require('./SafetyGuard');
const { CronLogger } = require('./CronLogger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CronEngine {
  constructor(whatsapp, io) {
    this.whatsapp = whatsapp; // Instance of Whatsapp class
    this.io = io;
    this.activeWorkers = new Map(); // campaignId -> [SIMWorker]
    this.logger = new CronLogger('MAIN');
  }

  async startCampaign(campaignData) {
    const { id, name, numbers, message, media, selectedSIMs } = campaignData;

    this.logger.info(`Starting campaign: ${name} (${id})`);

    // Safety pre-check
    const safetyCheck = await safetyGuard.preCampaignCheck(campaignData);
    if (!safetyCheck.safe) {
      return { success: false, issues: safetyCheck.issues };
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'active', startedAt: new Date(), totalNumbers: numbers.length }
    });

    const distributed = this.distributeNumbers(numbers, selectedSIMs);
    const workers = [];

    for (const [simId, simNumbers] of Object.entries(distributed)) {
      if (simNumbers.length === 0) continue;

      const worker = new SIMWorker(simId, this.whatsapp, this.io);
      worker.loadQueue(simNumbers, message, media);
      workers.push(worker);

      worker.start(id).then(() => {
        this.checkCampaignCompletion(id);
      }).catch(err => {
        this.logger.error(`Worker error for SIM ${simId}: ${err.message}`);
      });
    }

    this.activeWorkers.set(id, workers);
    return { success: true, workersStarted: workers.length };
  }

  distributeNumbers(numbers, simIds) {
    const distribution = {};
    simIds.forEach(id => (distribution[id] = []));

    numbers.forEach((num, index) => {
      const simId = simIds[index % simIds.length];
      distribution[simId].push(num);
    });

    return distribution;
  }

  async pauseCampaign(campaignId) {
    const workers = this.activeWorkers.get(campaignId);
    if (workers) workers.forEach(w => w.pause());
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'paused' } });
    return { success: true };
  }

  async resumeCampaign(campaignId) {
    const workers = this.activeWorkers.get(campaignId);
    if (workers) workers.forEach(w => w.resume());
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'active' } });
    return { success: true };
  }

  async stopCampaign(campaignId) {
    const workers = this.activeWorkers.get(campaignId);
    if (workers) {
      workers.forEach(w => w.stop());
      this.activeWorkers.delete(campaignId);
    }
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'stopped', completedAt: new Date() } });
    return { success: true };
  }

  async checkCampaignCompletion(campaignId) {
    const workers = this.activeWorkers.get(campaignId);
    if (!workers) return;

    const allDone = workers.every(w => !w.isRunning);
    if (allDone) {
      this.activeWorkers.delete(campaignId);
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'completed', completedAt: new Date() }
      });
      this.io.emit(`campaign:${campaignId}`, { event: 'campaign_complete' });
      this.logger.info(`Campaign ${campaignId} completed successfully.`);
    }
  }
}

module.exports = CronEngine;
