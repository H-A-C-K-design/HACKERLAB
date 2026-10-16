import { PrismaClient, Role, CourseLevel } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial CyberForge Academy database...');

  // Create sample approved teacher
  const teacherPassword = await hashPassword('CyberForge123!');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@cyberforge.academy' },
    update: {},
    create: {
      email: 'teacher@cyberforge.academy',
      fullName: 'Alex Vance, CISSP',
      passwordHash: teacherPassword,
      role: Role.TEACHER,
      emailVerified: true,
      teacherProfile: {
        create: {
          headline: 'Lead Offensive Security Engineer & Red Teamer',
          bio: '12+ years of professional penetration testing and red teaming for Fortune 500 banks and defense contractors.',
          city: 'Bengaluru',
          country: 'India',
          languages: ['English', 'Hindi'],
          experienceYears: 12,
          specializations: ['Web Pentesting', 'Red Teaming', 'Network Security', 'CTF'],
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: 'SEED_SCRIPT',
          bankAccounts: {
            create: {
              accountHolderName: 'Alex Vance',
              panLast4: '8899',
              accountLast4: '4321',
              ifsc: 'HDFC0001234',
              bankName: 'HDFC Bank',
              razorpayLinkedAccountId: 'acc_seed_teacher_123',
              isActive: true,
            },
          },
          subscription: {
            create: {
              razorpaySubscriptionId: 'sub_seed_alex_vance',
              status: 'active',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    },
    include: { teacherProfile: true },
  });

  // Create sample student
  const studentPassword = await hashPassword('Student123!');
  const student = await prisma.user.upsert({
    where: { email: 'student@cyberforge.academy' },
    update: {},
    create: {
      email: 'student@cyberforge.academy',
      fullName: 'Rahul Sharma',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      emailVerified: true,
      studentProfile: {
        create: {
          experienceLevel: CourseLevel.BEGINNER,
          interests: ['Web Pentesting', 'Network Security'],
        },
      },
    },
  });

  if (teacher.teacherProfile) {
    // Create featured courses
    const course1 = await prisma.course.upsert({
      where: { slug: 'hands-on-web-penetration-testing' },
      update: {},
      create: {
        teacherProfileId: teacher.teacherProfile.id,
        slug: 'hands-on-web-penetration-testing',
        title: 'Hands-on Web Application Penetration Testing',
        description: 'Master OWASP Top 10 vulnerabilities, SQL injection, Cross-Site Scripting (XSS), Server-Side Request Forgery (SSRF), and modern API exploitation in a completely legal and ethical sandbox.',
        level: CourseLevel.INTERMEDIATE,
        category: 'Web Pentesting',
        language: 'English',
        priceInPaise: 299900, // Rs 2,999
        prerequisites: ['Basic Linux command line', 'HTTP protocol understanding'],
        ethicalCheck: true,
        status: 'PUBLISHED',
        modules: {
          create: [
            {
              title: 'Module 1: Reconnaissance and Attack Surface Mapping',
              order: 1,
              lessons: {
                create: [
                  {
                    title: '1.1 Defensive & Ethical Boundaries in Pentesting',
                    order: 1,
                    type: 'VIDEO',
                    durationSec: 1200,
                    visibility: 'COURSE_ONLY',
                  },
                  {
                    title: '1.2 Subdomain Enumeration and Port Scanning with Nmap',
                    order: 2,
                    type: 'VIDEO',
                    durationSec: 1800,
                    visibility: 'COURSE_ONLY',
                  },
                ],
              },
            },
            {
              title: 'Module 2: Exploiting Modern Authentication and Access Control',
              order: 2,
              lessons: {
                create: [
                  {
                    title: '2.1 JWT Tampering & Algorithm Confusion Attacks',
                    order: 1,
                    type: 'VIDEO',
                    durationSec: 2100,
                    visibility: 'COURSE_ONLY',
                  },
                ],
              },
            },
          ],
        },
      },
    });

    const course2 = await prisma.course.upsert({
      where: { slug: 'fundamentals-of-ethical-hacking-and-defense' },
      update: {},
      create: {
        teacherProfileId: teacher.teacherProfile.id,
        slug: 'fundamentals-of-ethical-hacking-and-defense',
        title: 'Fundamentals of Ethical Hacking & Defensive Security',
        description: 'Complete beginner-friendly bootcamp into network protocols, Kali Linux tools, vulnerability scanners, and core security defensive controls.',
        level: CourseLevel.BEGINNER,
        category: 'Network Security',
        language: 'English',
        priceInPaise: 0, // Free course
        prerequisites: ['No prior cybersecurity experience needed'],
        ethicalCheck: true,
        status: 'PUBLISHED',
        modules: {
          create: [
            {
              title: 'Module 1: Introduction to Cybersecurity Fundamentals',
              order: 1,
              lessons: {
                create: [
                  {
                    title: '1.1 The Hacker Mindset: Ethical vs Malicious',
                    order: 1,
                    type: 'VIDEO',
                    durationSec: 900,
                    visibility: 'PUBLIC_PREVIEW',
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Create an upcoming live class
    const nextLiveTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    await prisma.liveClass.upsert({
      where: { livekitRoomName: 'class_seed_demo_live' },
      update: {},
      create: {
        courseId: course1.id,
        title: 'Live Lab: Bypassing WAFs with Custom SQLi Payloads',
        scheduledStart: nextLiveTime,
        durationMin: 90,
        maxParticipants: 100,
        status: 'SCHEDULED',
        livekitRoomName: 'class_seed_demo_live',
      },
    });

    // Enroll sample student in Course 2 (Free)
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
      update: {},
      create: {
        studentId: student.id,
        courseId: course2.id,
        source: 'FREE',
      },
    });
  }

  console.log('✔ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
