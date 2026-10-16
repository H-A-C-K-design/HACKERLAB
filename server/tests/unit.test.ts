import { describe, it, expect } from 'vitest';
import { hashToken, generateSecureToken, encryptField, decryptField, maskAccount, maskPan } from '../src/utils/crypto';
import { formatINR, formatIST } from '../src/utils/formatters';
import { verifyWebhookSignature, verifyPaymentSignature } from '../src/services/razorpay.service';
import crypto from 'crypto';
import { config } from '../src/config';

describe('Unit Tests: Crypto & Formatting Utilities', () => {
  it('should hash tokens deterministically using SHA-256', () => {
    const raw = 'my-verification-token-123';
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('should generate secure random tokens', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes in hex = 64 chars
  });

  it('should encrypt and decrypt sensitive fields with AES-256-GCM', () => {
    const sensitive = '1234567890123456';
    const cipherText = encryptField(sensitive);
    expect(cipherText).not.toBe(sensitive);
    const decrypted = decryptField(cipherText);
    expect(decrypted).toBe(sensitive);
  });

  it('should format bank account and PAN with masking', () => {
    expect(maskAccount('98765432101234')).toBe('XXXX1234');
    expect(maskPan('ABCDE1234F')).toBe('XXXXXX234F');
  });

  it('should format Indian Rupee currency correctly', () => {
    // 12000000 paise = Rs 1,20,000
    expect(formatINR(12000000, true)).toBe('Rs 1,20,000');
    // 299900 paise = Rs 2,999
    expect(formatINR(299900, true)).toBe('Rs 2,999');
    // 40000 paise = Rs 400
    expect(formatINR(40000, true)).toBe('Rs 400');
  });

  it('should format date in Indian Standard Time (IST)', () => {
    const date = new Date('2026-05-15T10:00:00Z');
    const ist = formatIST(date);
    expect(ist).toContain('(IST)');
  });
});

describe('Unit Tests: Razorpay Signature Verification', () => {
  it('should verify valid Razorpay webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const signature = crypto
      .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    const isValid = verifyWebhookSignature(body, signature);
    expect(isValid).toBe(true);
  });

  it('should reject invalid Razorpay webhook signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' });
    const fakeSignature = '0000000000000000000000000000000000000000000000000000000000000000';
    const isValid = verifyWebhookSignature(body, fakeSignature);
    expect(isValid).toBe(false);
  });

  it('should verify valid payment signature', () => {
    const orderId = 'order_12345';
    const paymentId = 'pay_67890';
    const expected = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyPaymentSignature(orderId, paymentId, expected);
    expect(isValid).toBe(true);
  });
});
