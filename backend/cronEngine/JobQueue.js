const timingEngine = require('./TimingEngine');
const safetyGuard = require('./SafetyGuard');
const { CronLogger } = require('./CronLogger');

class SIMWorker {
  constructor(simId, whatsapp, io) {
    this.simId = simId;
    this.whatsapp = whatsapp; // Instance of Whatsapp class from wa-multi-session
    this.io = io;
    this.isRunning = false;
    this.isPaused = false;
    this.queue = [];
    this.sentCount = 0;
    this.failedCount = 0;
    this.currentBurstCount = 0;
    this.burstLimit = timingEngine.getBurstSize();
    this.sessionStart = Date.now();
    this.logger = new CronLogger(simId);
  }

  loadQueue(numbers, message, media = null) {
    this.queue = numbers.map(num => ({
      number: num.phone,
      name: num.name || '',
      message,
      media,
      attempts: 0
    }));
    this.logger.info(`Queue loaded: ${this.queue.length} numbers`);
  }

  async start(campaignId) {
    this.isRunning = true;
    this.campaignId = campaignId;
    
    this.logger.info(`Worker started for SIM: ${this.simId}`);
    
    const initDelay = timingEngine.getInitialDelay();
    await this.sleep(initDelay);

    while (this.queue.length > 0 && this.isRunning) {
      if (this.isPaused) {
        await this.sleep(5000);
        continue;
      }

      // Safety checks
      const sessionStatus = safetyGuard.isSessionExpired(this.sessionStart);
      if (sessionStatus.expired) {
        this.logger.warn(`Session window expired (${sessionStatus.elapsedHours}h). Stopping.`);
        break;
      }

      const simStatus = await safetyGuard.canSIMSend(this.simId);
      if (!simStatus.canSend) {
        this.logger.warn(`Daily limit reached: ${simStatus.sentToday}/120. Stopping.`);
        break;
      }

      const job = this.queue.shift();
      await this.processJob(job);

      this.currentBurstCount++;
      if (this.currentBurstCount >= this.burstLimit) {
        await this.takeBurstBreak();
        this.burstLimit = timingEngine.getBurstSize();
        this.currentBurstCount = 0;
      } else if (this.queue.length > 0) {
        const gap = timingEngine.getMessageGap();
        this.emitUpdate('waiting', gap.seconds);
        await this.sleep(safetyGuard.validateGap(gap.ms));
      }
    }

    this.isRunning = false;
    this.emitUpdate('sim_complete', 0);
  }

  async processJob(job) {
    try {
      // Step 1: Simulate Typing
      const typingDuration = timingEngine.getTypingDuration(job.message);
      
      // Access underlying Baileys socket for presence
      const session = await this.whatsapp.getSessionById(this.simId);
      if (!session) throw new Error("Session disconnected");

      await session.sock.sendPresenceUpdate('composing', job.number + '@s.whatsapp.net');
      await this.sleep(typingDuration);
      await session.sock.sendPresenceUpdate('paused', job.number + '@s.whatsapp.net');
      await this.sleep(300);

      // Step 2: Send Message
      if (job.media) {
        await this.sendMedia(job);
      } else {
        await this.whatsapp.sendText({
          sessionId: this.simId,
          to: job.number,
          text: job.message
        });
      }

      this.sentCount++;
      await this.logger.logSuccess(job, this.campaignId);
      this.emitUpdate('message_sent', 0, { number: job.number, name: job.name });

    } catch (error) {
      this.failedCount++;
      await this.logger.logFailure(job, this.campaignId, error.message);
      
      job.attempts++;
      if (job.attempts < 2) {
        this.queue.push(job); // Retry later
      }
    }
  }

  async sendMedia(job) {
    const props = {
      sessionId: this.simId,
      to: job.number,
      text: job.message,
      media: job.media.url || job.media.buffer
    };

    if (job.media.type === 'image') await this.whatsapp.sendImage(props);
    else if (job.media.type === 'video') await this.whatsapp.sendVideo(props);
    else if (job.media.type === 'document') {
      await this.whatsapp.sendDocument({ ...props, filename: job.media.fileName });
    }
  }

  async takeBurstBreak() {
    const breakTime = timingEngine.getBurstBreak();
    this.logger.info(`Taking burst break: ${breakTime.display}`);
    this.emitUpdate('burst_break', breakTime.ms / 1000);
    await this.sleep(breakTime.ms);
  }

  pause() { this.isPaused = true; }
  resume() { this.isPaused = false; }
  stop() { this.isRunning = false; this.queue = []; }

  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  emitUpdate(event, countdown, extra = {}) {
    if (this.io) {
      this.io.emit(`campaign:${this.campaignId}`, {
        simId: this.simId,
        event,
        countdown,
        sentCount: this.sentCount,
        failedCount: this.failedCount,
        queueRemaining: this.queue.length,
        ...extra
      });
    }
  }
}

module.exports = SIMWorker;
