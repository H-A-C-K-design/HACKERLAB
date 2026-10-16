import { Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { verifyWebhookSignature } from '../../services/razorpay.service';
import { sendSubscriptionNoticeEmail, sendPaymentReceiptEmail } from '../../services/email.service';
import { logAuditAction } from '../../utils/audit';
import { config } from '../../config';

export async function handleRazorpayWebhook(req: Request, res: Response) {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
  }

  const payload = req.body;
  const eventId = payload.event_id || `${payload.event}_${payload.created_at || Date.now()}`;
  const eventType = payload.event;

  // Idempotency check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent && existingEvent.processedAt) {
    return res.json({ success: true, message: 'Webhook event already processed (idempotent).' });
  }

  // Record received event
  await prisma.webhookEvent.upsert({
    where: { eventId },
    create: {
      eventId,
      type: eventType,
      payload,
    },
    update: {
      type: eventType,
      payload,
    },
  });

  try {
    switch (eventType) {
      // ── Teacher Subscriptions ──
      case 'subscription.activated':
      case 'subscription.charged': {
        const subData = payload.payload?.subscription?.entity;
        if (subData) {
          const razorpaySubscriptionId = subData.id;
          const currentPeriodEnd = subData.current_end ? new Date(subData.current_end * 1000) : null;

          const updatedSub = await prisma.teacherSubscription.update({
            where: { razorpaySubscriptionId },
            data: {
              status: 'active',
              currentPeriodEnd,
              graceUntil: null,
            },
            include: {
              teacherProfile: {
                include: { user: true },
              },
            },
          });

          // If teacher is still in DRAFT, move to PENDING_APPROVAL
          if (updatedSub.teacherProfile.status === 'DRAFT') {
            await prisma.teacherProfile.update({
              where: { id: updatedSub.teacherProfileId },
              data: { status: 'PENDING_APPROVAL' },
            });
          }

          await sendSubscriptionNoticeEmail(
            updatedSub.teacherProfile.user.email,
            updatedSub.teacherProfile.user.fullName,
            'Active',
            'Your monthly subscription payment was processed successfully.'
          );
        }
        break;
      }

      case 'subscription.halted':
      case 'subscription.cancelled': {
        const subData = payload.payload?.subscription?.entity;
        if (subData) {
          const razorpaySubscriptionId = subData.id;
          const graceDays = config.SUBSCRIPTION_GRACE_DAYS;
          const graceUntil = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

          const sub = await prisma.teacherSubscription.findUnique({
            where: { razorpaySubscriptionId },
            include: { teacherProfile: { include: { user: true } } },
          });

          if (sub) {
            await prisma.teacherSubscription.update({
              where: { id: sub.id },
              data: {
                status: eventType === 'subscription.halted' ? 'halted' : 'cancelled',
                graceUntil,
              },
            });

            await sendSubscriptionNoticeEmail(
              sub.teacherProfile.user.email,
              sub.teacherProfile.user.fullName,
              eventType === 'subscription.halted' ? 'Halted' : 'Cancelled',
              `Your subscription has failed or was cancelled. A grace period of ${graceDays} days has been granted.`
            );
          }
        }
        break;
      }

      // ── Student Course Payments ──
      case 'payment.captured':
      case 'order.paid': {
        const paymentData = payload.payload?.payment?.entity;
        const orderData = payload.payload?.order?.entity;
        const razorpayOrderId = paymentData?.order_id || orderData?.id;
        const razorpayPaymentId = paymentData?.id;

        if (razorpayOrderId) {
          const order = await prisma.order.findUnique({
            where: { razorpayOrderId },
            include: {
              course: { include: { teacherProfile: true } },
              student: true,
            },
          });

          if (order) {
            const grossPaise = order.amountInPaise;
            const commission = config.PLATFORM_COMMISSION_PERCENT;
            const platformFeePaise = Math.round((grossPaise * commission) / 100);
            const teacherNetPaise = grossPaise - platformFeePaise;

            await prisma.$transaction([
              prisma.order.update({
                where: { id: order.id },
                data: {
                  status: 'PAID',
                  razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
                },
              }),
              prisma.enrollment.upsert({
                where: {
                  studentId_courseId: {
                    studentId: order.studentId,
                    courseId: order.courseId,
                  },
                },
                create: {
                  studentId: order.studentId,
                  courseId: order.courseId,
                  source: 'PAID',
                },
                update: {
                  revokedAt: null,
                },
              }),
              prisma.ledgerEntry.create({
                data: {
                  orderId: order.id,
                  teacherProfileId: order.course.teacherProfileId,
                  grossInPaise: grossPaise,
                  platformFeeInPaise: platformFeePaise,
                  teacherNetInPaise: teacherNetPaise,
                  type: 'PAYMENT',
                  status: 'SETTLED',
                  razorpayPaymentId,
                },
              }),
            ]);

            await sendPaymentReceiptEmail(
              order.student.email,
              order.student.fullName,
              order.course.title,
              grossPaise,
              razorpayPaymentId || order.razorpayOrderId
            );
          }
        }
        break;
      }

      // ── Razorpay Route Transfers (Payouts) ──
      case 'transfer.processed': {
        const transfer = payload.payload?.transfer?.entity;
        if (transfer) {
          await prisma.payout.updateMany({
            where: { razorpayTransferId: transfer.id },
            data: {
              status: 'PROCESSED',
              processedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'transfer.failed': {
        const transfer = payload.payload?.transfer?.entity;
        if (transfer) {
          await prisma.payout.updateMany({
            where: { razorpayTransferId: transfer.id },
            data: {
              status: 'FAILED',
            },
          });
        }
        break;
      }

      default:
        console.log(`ℹ Webhook event ${eventType} acknowledged.`);
    }

    // Mark event processed
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processedAt: new Date() },
    });

    return res.json({ success: true, event: eventType });
  } catch (error: any) {
    console.error('Error handling Razorpay webhook event:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function handleResendWebhook(req: Request, res: Response) {
  // Acknowledge bounce or deliverability events
  return res.json({ success: true });
}
