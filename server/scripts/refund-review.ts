import { prisma } from '../src/utils/prisma';
import { logAuditAction } from '../src/utils/audit';
import { razorpayInstance } from '../src/services/razorpay.service';
import { formatINR } from '../src/utils/formatters';
import { parseArgs, confirmAction } from './cli-helper';

async function main() {
  const args = parseArgs();
  const id = args.id as string;
  const decision = (args.decision as string)?.toLowerCase();
  const autoConfirm = Boolean(args.yes);

  if (!id || !['approve', 'reject'].includes(decision)) {
    console.error('❌ Error: --id <refundRequestId> and --decision <approve|reject> are required.');
    console.log('Usage: npm run refund:review -- --id <refundRequestId> --decision approve|reject [--yes]');
    process.exit(1);
  }

  const refund = await prisma.refundRequest.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          course: { select: { title: true, teacherProfileId: true } },
          student: { select: { fullName: true, email: true } },
        },
      },
    },
  });

  if (!refund) {
    console.error(`❌ Error: Refund request with ID "${id}" not found.`);
    process.exit(1);
  }

  if (refund.status !== 'PENDING') {
    console.warn(`⚠️ Warning: Refund request is already marked as ${refund.status}.`);
  }

  console.log('\n--- Refund Request Review ---');
  console.log(`Refund ID:    ${refund.id}`);
  console.log(`Student:      ${refund.order.student.fullName} (${refund.order.student.email})`);
  console.log(`Course:       ${refund.order.course.title}`);
  console.log(`Amount:       ${formatINR(refund.order.amountInPaise, true)}`);
  console.log(`Payment ID:   ${refund.order.razorpayPaymentId || 'N/A'}`);
  console.log(`Reason:       "${refund.reason}"`);
  console.log(`Requested At: ${refund.createdAt.toISOString()}`);

  const confirmed = await confirmAction(
    `Are you sure you want to ${decision.toUpperCase()} this refund request?`,
    autoConfirm
  );

  if (!confirmed) {
    console.log('Operation aborted.');
    process.exit(0);
  }

  if (decision === 'approve') {
    // Process Razorpay refund if live payment exists
    if (refund.order.razorpayPaymentId) {
      try {
        await razorpayInstance.payments.refund(refund.order.razorpayPaymentId, {
          amount: refund.order.amountInPaise,
          notes: { refundRequestId: refund.id },
        });
      } catch (err: any) {
        console.warn('Razorpay refund API call note (continuing database update):', err?.error?.description || err.message);
      }
    }

    // Database transaction: update refund, order, revoke enrollment, and write ledger refund
    await prisma.$transaction([
      prisma.refundRequest.update({
        where: { id: refund.id },
        data: {
          status: 'APPROVED',
          reviewedBy: 'CLI_OPERATOR',
          reviewedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: refund.orderId },
        data: { status: 'REFUNDED' },
      }),
      prisma.enrollment.updateMany({
        where: {
          studentId: refund.order.studentId,
          courseId: refund.order.courseId,
        },
        data: { revokedAt: new Date() },
      }),
      prisma.ledgerEntry.create({
        data: {
          orderId: refund.orderId,
          teacherProfileId: refund.order.course.teacherProfileId,
          grossInPaise: -refund.order.amountInPaise,
          platformFeeInPaise: 0,
          teacherNetInPaise: -refund.order.amountInPaise,
          type: 'REFUND',
          status: 'SETTLED',
          razorpayPaymentId: refund.order.razorpayPaymentId,
        },
      }),
    ]);

    await logAuditAction({
      actorUserId: null,
      action: 'REFUND_APPROVED_BY_CLI',
      entityType: 'RefundRequest',
      entityId: refund.id,
      metadata: {
        orderId: refund.orderId,
        amount: refund.order.amountInPaise,
      },
    });

    console.log('\n✅ SUCCESS: Refund request APPROVED!');
    console.log('Course enrollment revoked and negative ledger entry recorded.\n');
  } else {
    await prisma.refundRequest.update({
      where: { id: refund.id },
      data: {
        status: 'REJECTED',
        reviewedBy: 'CLI_OPERATOR',
        reviewedAt: new Date(),
      },
    });

    await logAuditAction({
      actorUserId: null,
      action: 'REFUND_REJECTED_BY_CLI',
      entityType: 'RefundRequest',
      entityId: refund.id,
      metadata: { orderId: refund.orderId },
    });

    console.log('\n❌ SUCCESS: Refund request REJECTED.');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('CLI Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
