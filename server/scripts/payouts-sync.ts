import { prisma } from '../src/utils/prisma';
import { razorpayInstance } from '../src/services/razorpay.service';

async function main() {
  console.log('\n--- Syncing Teacher Payout Transfers from Razorpay Route ---');

  const pendingPayouts = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: { teacherProfile: { include: { user: true } } },
  });

  if (pendingPayouts.length === 0) {
    console.log('No pending payouts found in database. All payouts are currently up-to-date.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Checking ${pendingPayouts.length} pending transfer(s)...`);
  let synced = 0;

  for (const payout of pendingPayouts) {
    try {
      const transfer = await (razorpayInstance as any).transfers.fetch(payout.razorpayTransferId);
      if (transfer && transfer.status) {
        let newStatus: 'PROCESSED' | 'FAILED' | 'PENDING' = 'PENDING';
        if (transfer.status === 'processed') newStatus = 'PROCESSED';
        if (transfer.status === 'failed') newStatus = 'FAILED';

        if (newStatus !== payout.status) {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: newStatus,
              processedAt: newStatus === 'PROCESSED' ? new Date() : undefined,
            },
          });
          synced++;
          console.log(`✔ Transfer ${payout.razorpayTransferId} updated to ${newStatus} (Instructor: ${payout.teacherProfile.user.fullName})`);
        }
      }
    } catch (err: any) {
      console.warn(`Could not sync transfer ${payout.razorpayTransferId}:`, err?.error?.description || err.message);
    }
  }

  console.log(`\n✅ Payout sync completed. ${synced} record(s) updated.\n`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('CLI Sync Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
