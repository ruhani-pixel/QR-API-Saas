const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  try {
    await prisma.message.deleteMany({});
    await prisma.messageLog.deleteMany({});
    await prisma.device.deleteMany({});
    console.log('✅ ALL DATABASE RECORDS CLEARED');
  } catch (e) {
    console.error('❌ FAILED TO CLEAR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
