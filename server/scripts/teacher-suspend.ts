import { prisma } from '../src/utils/prisma';
import { logAuditAction } from '../src/utils/audit';
import { parseArgs, confirmAction } from './cli-helper';

async function main() {
  const args = parseArgs();
  const email = (args.email as string)?.toLowerCase();
  const autoConfirm = Boolean(args.yes);

  if (!email) {
    console.error('❌ Error: --email argument is required.');
    console.log('Usage: npm run teacher:suspend -- --email teacher@example.com [--yes]');
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

  console.log('\n--- Teacher Suspension Warning ---');
  console.log(`Instructor: ${user.fullName}`);
  console.log(`Email:      ${user.email}`);
  console.log(`Current:    ${profile.status}`);

  const confirmed = await confirmAction(
    `SUSPEND instructor "${user.fullName}" (${user.email})? This will hide their published courses and cancel upcoming live classes.`,
    autoConfirm
  );

  if (!confirmed) {
    console.log('Suspension aborted by operator.');
    process.exit(0);
  }

  const [updatedProfile, hiddenCourses, cancelledLive] = await prisma.$transaction([
    prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { status: 'SUSPENDED' },
    }),
    prisma.course.updateMany({
      where: { teacherProfileId: profile.id, status: 'PUBLISHED' },
      data: { status: 'HIDDEN' },
    }),
    prisma.liveClass.updateMany({
      where: {
        course: { teacherProfileId: profile.id },
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      data: { status: 'CANCELLED' },
    }),
  ]);

  await logAuditAction({
    actorUserId: null,
    action: 'TEACHER_SUSPENDED_BY_CLI',
    entityType: 'TeacherProfile',
    entityId: updatedProfile.id,
    metadata: {
      email: user.email,
      coursesHidden: hiddenCourses.count,
      liveClassesCancelled: cancelledLive.count,
    },
  });

  console.log('\n🛑 SUCCESS: Teacher profile SUSPENDED!');
  console.log(`ID:                     ${updatedProfile.id}`);
  console.log(`Instructor:             ${user.fullName}`);
  console.log(`Status:                 SUSPENDED`);
  console.log(`Published courses hidden: ${hiddenCourses.count}`);
  console.log(`Scheduled live cancelled: ${cancelledLive.count}`);
  console.log('Audit log entry written.\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('CLI Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
