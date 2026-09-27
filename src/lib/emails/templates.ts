export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function trialEndingEmail(data: {
  userName: string;
  trialEndDate: string;
  planName: string;
  price: string;
  checkoutUrl: string;
}): EmailTemplate {
  const subject = `Your FitBuzz Pro trial ends in 3 days`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c211b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #f2f4ef; border-radius: 12px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; width: 48px; height: 48px; background: #d8f46a; border-radius: 12px; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c211b" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Your trial ends soon</h1>
    </div>
    
    <p style="font-size: 16px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px;">
      Your 14-day <strong>${data.planName}</strong> trial ends on <strong>${data.trialEndDate}</strong>. 
      After that, your subscription will automatically continue at <strong>${data.price}/month</strong>.
    </p>
    
    <div style="background: #fff; border: 1px solid #e5e8e1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">What you'll keep with Pro:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4d564c;">
        <li>AI-powered workout plans</li>
        <li>AI form coaching</li>
        <li>Advanced analytics (6-month charts)</li>
        <li>Unlimited custom plans</li>
        <li>5,000 API calls/month</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.checkoutUrl}" style="display: inline-block; background: #d8f46a; color: #1c211b; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">
        Continue with Pro →
      </a>
    </div>
    
    <p style="font-size: 13px; color: #7b8178; text-align: center;">
      Not ready? You can <a href="${data.checkoutUrl}?downgrade=true" style="color: #7ba5d8;">downgrade to Free</a> anytime before the trial ends.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e8e1; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #7b8178; text-align: center;">
      Questions? <a href="mailto:support@fitbuzz.app" style="color: #7ba5d8;">Reply to this email</a> — we're happy to help.
    </p>
  </div>
</body>
</html>`;
  const text = `
Hi ${data.userName},

Your 14-day ${data.planName} trial ends on ${data.trialEndDate}. After that, your subscription will automatically continue at ${data.price}/month.

What you'll keep with Pro:
- AI-powered workout plans
- AI form coaching
- Advanced analytics (6-month charts)
- Unlimited custom plans
- 5,000 API calls/month

Continue with Pro: ${data.checkoutUrl}

Not ready? You can downgrade to Free anytime before the trial ends.

Questions? Reply to this email — we're happy to help.
`;

  return { subject, html, text };
}

export function paymentFailedEmail(data: {
  userName: string;
  planName: string;
  retryUrl: string;
  attemptNumber: number;
}): EmailTemplate {
  const subject = `Payment failed for your FitBuzz ${data.planName} subscription`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c211b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #f2f4ef; border-radius: 12px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; width: 48px; height: 48px; background: #ffe0e0; border-radius: 12px; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e76c54" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Payment couldn't be processed</h1>
    </div>
    
    <p style="font-size: 16px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px;">
      We couldn't process your payment for <strong>${data.planName}</strong> (attempt ${data.attemptNumber} of 3).
      Your subscription will remain active for now, but we need to update your payment method to avoid interruption.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.retryUrl}" style="display: inline-block; background: #e76c54; color: #fff; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">
        Update Payment Method →
      </a>
    </div>
    
    <p style="font-size: 13px; color: #7b8178; text-align: center;">
      We'll retry automatically in 24 hours. If payment fails 3 times, your subscription will be downgraded to Free.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e8e1; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #7b8178; text-align: center;">
      Questions? <a href="mailto:support@fitbuzz.app" style="color: #7ba5d8;">Reply to this email</a> — we're happy to help.
    </p>
  </div>
</body></html>`;
  const text = `
Hi ${data.userName},

We couldn't process your payment for ${data.planName} (attempt ${data.attemptNumber} of 3).
Your subscription will remain active for now, but we need to update your payment method to avoid interruption.

Update Payment Method: ${data.retryUrl}

We'll retry automatically in 24 hours. If payment fails 3 times, your subscription will be downgraded to Free.

Questions? Reply to this email — we're happy to help.
`;

  return { subject, html, text };
}

export function renewalReminderEmail(data: {
  userName: string;
  planName: string;
  price: string;
  renewalDate: string;
  manageUrl: string;
}): EmailTemplate {
  const subject = `Your FitBuzz ${data.planName} subscription renews soon`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c211b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #f2f4ef; border-radius: 12px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; width: 48px; height: 48px; background: #d8f46a; border-radius: 12px; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c211b" stroke-width="2">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Your subscription renews soon</h1>
    </div>
    
    <p style="font-size: 16px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px;">
      Your <strong>${data.planName}</strong> subscription will renew on <strong>${data.renewalDate}</strong> 
      for <strong>${data.price}</strong>.
    </p>
    
    <div style="background: #fff; border: 1px solid #e5e8e1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">Manage your subscription:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4d564c;">
        <li>Update payment method</li>
        <li>Switch to annual billing (save 17%)</li>
        <li>Upgrade or downgrade your plan</li>
        <li>Cancel anytime</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.manageUrl}" style="display: inline-block; background: #1c211b; color: #fff; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">
        Manage Subscription →
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e8e1; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #7b8178; text-align: center;">
      Questions? <a href="mailto:support@fitbuzz.app" style="color: #7ba5d8;">Reply to this email</a> — we're happy to help.
    </p>
  </div>
</body></html>`;
  const text = `
Hi ${data.userName},

Your ${data.planName} subscription will renew on ${data.renewalDate} for ${data.price}.

Manage your subscription:
- Update payment method
- Switch to annual billing (save 17%)
- Upgrade or downgrade your plan
- Cancel anytime

Manage Subscription: ${data.manageUrl}

Questions? Reply to this email — we're happy to help.
`;

  return { subject, html, text };
}

export function trialEndedEmail(data: {
  userName: string;
  planName: string;
  checkoutUrl: string;
}): EmailTemplate {
  const subject = `Your FitBuzz Pro trial has ended`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1c211b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #f2f4ef; border-radius: 12px; padding: 32px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-flex; width: 48px; height: 48px; background: #f0f4e3; border-radius: 12px; align-items: center; justify-content: center; margin-bottom: 16px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aecf3f" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Trial ended — you're now on Free</h1>
    </div>
    
    <p style="font-size: 16px;">Hi ${data.userName},</p>
    
    <p style="font-size: 16px;">
      Your ${data.planName} trial has ended and your account has been switched to the <strong>Free plan</strong>.
      You still have access to all your workout data and core tracking features.
    </p>
    
    <div style="background: #fff; border: 1px solid #e5e8e1; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">What's included in Free:</h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4d564c;">
        <li>Core workout tracking</li>
        <li>100 API calls per month</li>
        <li>1 custom training plan</li>
        <li>Basic progress stats</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.checkoutUrl}" style="display: inline-block; background: #d8f46a; color: #1c211b; padding: 14px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">
        Upgrade to Pro →
      </a>
    </div>
    
    <p style="font-size: 13px; color: #7b8178; text-align: center;">
      Your data is safe. Upgrade anytime to restore Pro features.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e8e1; margin: 24px 0;">
    
    <p style="font-size: 12px; color: #7b8178; text-align: center;">
      Questions? <a href="mailto:support@fitbuzz.app" style="color: #7ba5d8;">Reply to this email</a> — we're happy to help.
    </p>
  </div>
</body></html>`;
  const text = `
Hi ${data.userName},

Your ${data.planName} trial has ended and your account has been switched to the Free plan.
You still have access to all your workout data and core tracking features.

What's included in Free:
- Core workout tracking
- 100 API calls per month
- 1 custom training plan
- Basic progress stats

Upgrade to Pro: ${data.checkoutUrl}

Your data is safe. Upgrade anytime to restore Pro features.

Questions? Reply to this email — we're happy to help.
`;

  return { subject, html, text };
}