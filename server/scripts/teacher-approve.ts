import { prisma } from '../src/utils/prisma';
import { logAuditAction } from '../src/utils/audit';
import { parseArgs, confirmAction } from './cli-helper';

async function main() {
  const args = parseArgs();
  const email = (args.email as string)?.toLowerCase();
  const autoConfirm = Boolean(args.yes);

  if (!email) {
    console.error('❌ Error: --email argument is required.');
    console.log('Usage: npm run teacher:approve -- --email teacher@example.com [--yes]');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { teacherProfile: true },
  });

  if (!user || user.role !== 'TEACHER' || !user.teacherProfile) {
    console.error(`❌ Error: No teacher profile found for email "${email}".`);
    process.exit(1);
  }

  const profile = user.teacherProfile;

  console.log('\n--- Teacher Approval Review ---');
  console.log(`Instructor: ${user.fullName}`);
  console.log(`Email:      ${user.email}`);
  console.log(`Current:    ${profile.status}`);
  console.log(`Headline:   ${profile.headline || 'None'}`);

  const confirmed = await confirmAction(
    `Approve instructor "${user.fullName}" (${user.email}) to publish courses and host live classes?`,
    autoConfirm
  );

  if (!confirmed) {
    console.log('Approval aborted by operator.');
    process.exit(0);
  }

  const updated = await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'CLI_OPERATOR',
    },
  });

  await logAuditAction({
    actorUserId: null,
    action: 'TEACHER_APPROVED_BY_CLI',
    entityType: 'TeacherProfile',
    entityId: updated.id,
    metadata: { email: user.email, previousStatus: profile.status },
  });

  console.log('\n✅ SUCCESS: Teacher profile approved!');
  console.log(`ID:         ${updated.id}`);
  console.log(`Instructor: ${user.fullName}`);
  console.log(`Status:     APPROVED`);
  console.log(`ApprovedAt: ${updated.approvedAt?.toISOString()}`);
  console.log('Audit log entry written.\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('CLI Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
