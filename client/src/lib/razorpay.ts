declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  key?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    razorpay_subscription_id?: string;
  }) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export function openRazorpayModal(options: RazorpayCheckoutOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.Razorpay) {
      reject(new Error('Razorpay SDK failed to load. Please refresh the page.'));
      return;
    }

    const defaultKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_cyberforge123';

    const rzp = new window.Razorpay({
      key: options.key || defaultKey,
      name: options.name || 'CyberForge Academy',
      description: options.description || 'Ethical Hacking Education',
      image: '/cyberforge-logo.svg',
      currency: options.currency || 'INR',
      theme: {
        color: '#22D3EE', // Cyan accent
      },
      ...options,
      handler: (res: any) => {
        if (options.handler) options.handler(res);
        resolve(res);
      },
      modal: {
        ondismiss: () => {
          if (options.modal?.ondismiss) options.modal.ondismiss();
          reject(new Error('Payment was cancelled by the user.'));
        },
      },
    });

    rzp.open();
  });
}
