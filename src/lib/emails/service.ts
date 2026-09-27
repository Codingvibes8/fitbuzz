import type { EmailTemplate } from "./templates";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    console.log("[EMAIL] Sending email:", {
      to: options.to,
      subject: options.subject,
      preview: options.text.slice(0, 100) + "...",
    });
    return { success: true, id: `dev-${Date.now()}` };
  }
}

class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string = "FitBuzz <noreply@fitbuzz.app>") {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || "Failed to send email" };
      }
      return { success: true, id: data.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
}

function getEmailProvider(): EmailProvider {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    return new ResendEmailProvider(resendApiKey);
  }
  return new ConsoleEmailProvider();
}

const provider = getEmailProvider();

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  return provider.send(options);
}

export async function sendTrialEndingEmail(data: Parameters<typeof import("./templates").trialEndingEmail>[0]): Promise<{ success: boolean; id?: string; error?: string }> {
  const { trialEndingEmail } = await import("./templates");
  const email = trialEndingEmail(data);
  return sendEmail({ to: data.userName.includes("@") ? data.userName : `${data.userName.toLowerCase().replace(/\s+/g, ".")}@example.com`, ...email });
}

export async function sendPaymentFailedEmail(data: Parameters<typeof import("./templates").paymentFailedEmail>[0]): Promise<{ success: boolean; id?: string; error?: string }> {
  const { paymentFailedEmail } = await import("./templates");
  const email = paymentFailedEmail(data);
  return sendEmail({ to: data.userName.includes("@") ? data.userName : `${data.userName.toLowerCase().replace(/\s+/g, ".")}@example.com`, ...email });
}

export async function sendRenewalReminderEmail(data: Parameters<typeof import("./templates").renewalReminderEmail>[0]): Promise<{ success: boolean; id?: string; error?: string }> {
  const { renewalReminderEmail } = await import("./templates");
  const email = renewalReminderEmail(data);
  return sendEmail({ to: data.userName.includes("@") ? data.userName : `${data.userName.toLowerCase().replace(/\s+/g, ".")}@example.com`, ...email });
}

export async function sendTrialEndedEmail(data: Parameters<typeof import("./templates").trialEndedEmail>[0]): Promise<{ success: boolean; id?: string; error?: string }> {
  const { trialEndedEmail } = await import("./templates");
  const email = trialEndedEmail(data);
  return sendEmail({ to: data.userName.includes("@") ? data.userName : `${data.userName.toLowerCase().replace(/\s+/g, ".")}@example.com`, ...email });
}