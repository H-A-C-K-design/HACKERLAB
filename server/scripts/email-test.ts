import { sendTestEmail } from '../src/services/email.service';
import { parseArgs } from './cli-helper';

async function main() {
  const args = parseArgs();
  const to = args.to as string;

  if (!to) {
    console.error('❌ Error: --to <recipientEmail> is required.');
    console.log('Usage: npm run email:test -- --to you@example.com');
    process.exit(1);
  }

  console.log(`\n--- Sending DNS & Resend Configuration Test Email ---`);
  console.log(`Recipient: ${to}`);

  const result = await sendTestEmail(to);

  if (result.success) {
    console.log(`\n✅ SUCCESS: ${result.message}`);
    console.log('Resend credentials and DNS records are verified.\n');
  } else {
    console.error(`\n❌ FAILED: ${result.message}`);
    console.error('Please verify your RESEND_API_KEY and DNS records (SPF, DKIM, DMARC).\n');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Email Test Error:', e);
  process.exit(1);
});
