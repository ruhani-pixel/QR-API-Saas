const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CronEngine {
    constructor(whatsapp) {
        this.whatsapp = whatsapp;
        this.nodeStats = {}; 
        this.SAFETY_SPACER = 15000; 
    }

    async start() {
        console.log("🛡️ Solid Models Neural Engine v1.0 (9AM-7PM Window) Active");
        setInterval(() => this.processQueues(), 5000);
    }

    isInsideWindow() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= 9 && hour < 19; // 9 AM to 7 PM
    }

    async processQueues() {
        if (!this.isInsideWindow()) {
            // console.log("⏳ Outside sending window (9AM-7PM). Engine paused.");
            return;
        }

        const campaigns = await prisma.campaign.findMany({
            where: { status: 'active' },
            include: { 
                recipients: { 
                    where: { 
                        status: 'pending',
                        OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }]
                    }, 
                    take: 10 
                } 
            }
        });

        for (const campaign of campaigns) {
            const safety = JSON.parse(campaign.safetyConfig || '{}');
            const globalDevices = JSON.parse(campaign.selectedDevices || '[]');

            for (const recipient of campaign.recipients) {
                const targetNode = recipient.nodeId || this.findBestNode(globalDevices, safety);
                if (targetNode && await this.isNodeSafe(targetNode, safety)) {
                    await this.sendMessage(campaign, recipient, targetNode);
                }
            }
        }
    }

    findBestNode(deviceList, safety) {
        for (const sid of deviceList) {
            const stats = this.nodeStats[sid] || { lastSent: 0, count1m: 0, count15m: 0, dailyCount: 0, restUntil: 0 };
            if (stats.restUntil < Date.now() && stats.dailyCount < 150) {
                return sid;
            }
        }
        return null;
    }

    async isNodeSafe(sessionId, safety) {
        const stats = this.nodeStats[sessionId] || { lastSent: 0, count1m: 0, count15m: 0, dailyCount: 0, restUntil: 0 };
        const now = Date.now();

        if (now - stats.lastSent < this.SAFETY_SPACER) return false;
        if (stats.restUntil > now) return false;
        if (stats.count1m >= 5 && (now - stats.lastSent < 60000)) return false; // Max 5/min
        
        if (stats.count15m >= 20) { // Burst limit
            const restMins = Math.floor(Math.random() * (30 - 15 + 1) + 15);
            stats.restUntil = now + (restMins * 60000);
            stats.count15m = 0;
            console.log(`⏳ Node ${sessionId} resting for ${restMins}m`);
            return false;
        }

        if (stats.dailyCount >= 150) return false;
        return true;
    }

    async sendMessage(campaign, recipient, sessionId) {
        try {
            const stats = this.nodeStats[sessionId] || { lastSent: 0, count1m: 0, count15m: 0, dailyCount: 0, restUntil: 0 };
            const jitter = Math.floor(Math.random() * 15000) + 15000; // 15-30s jitter
            await new Promise(r => setTimeout(r, jitter));

            if (campaign.mediaPath) {
                const media = require('fs').readFileSync(require('path').join(__dirname, campaign.mediaPath));
                const isVideo = campaign.mediaPath.toLowerCase().endsWith('.mp4');
                if (isVideo) {
                    await this.whatsapp.sendVideo({ sessionId, to: recipient.number, media, text: recipient.message || campaign.message || '' });
                } else {
                    await this.whatsapp.sendImage({ sessionId, to: recipient.number, media, text: recipient.message || campaign.message || '' });
                }
            } else {
                await this.whatsapp.sendText({ sessionId, to: recipient.number, text: recipient.message || campaign.message || '' });
            }

            await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'sent' } });
            await prisma.campaign.update({ where: { id: campaign.id }, data: { totalSent: { increment: 1 } } });
            
            stats.lastSent = Date.now();
            stats.count1m++;
            stats.count15m++;
            stats.dailyCount++;
            this.nodeStats[sessionId] = stats;
            console.log(`✅ [${sessionId}] Sent to ${recipient.number}`);
        } catch (e) {
            console.error(`❌ Error:`, e.message);
            await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'failed' } });
            await prisma.campaign.update({ where: { id: campaign.id }, data: { totalFailed: { increment: 1 } } });
        }
    }
}

module.exports = CronEngine;
