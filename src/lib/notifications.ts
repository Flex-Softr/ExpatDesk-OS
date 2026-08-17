import nodemailer from "nodemailer";

interface SendLeadNotificationParams {
  leadId: string;
  name: string;
  email: string;
  phone?: string | null;
  serviceName?: string | null;
  preferredLang?: string | null;
  message: string;
}

/**
 * Send email notification to admin(s) when a new lead is submitted
 */
export async function sendLeadEmailNotification(
  params: SendLeadNotificationParams,
): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !adminEmail) {
    console.warn(
      "[Notification] SMTP environment variables not configured. Skipping email notification.",
    );
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = `[ExpatDesk Lead] New Request: ${params.serviceName || "General Inquiry"} - ${params.name}`;
    const text = `
New Lead Submission Received on ExpatDesk OS

Lead ID: ${params.leadId}
Client Name: ${params.name}
Email: ${params.email}
Phone: ${params.phone || "N/A"}
Preferred Language: ${params.preferredLang || "en"}
Requested Service: ${params.serviceName || "General Inquiry"}

Message / Request:
----------------------------------------
${params.message}
----------------------------------------

Manage this lead in ExpatDesk Admin Panel.
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">ExpatDesk — New Lead Request</h2>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; margin-top: 0;">You have received a new service booking request from your website.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 140px;">Client Name:</td>
              <td style="padding: 8px 0;">${params.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${params.email}">${params.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;">${params.phone || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Preferred Lang:</td>
              <td style="padding: 8px 0;">${(params.preferredLang || "en").toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Service:</td>
              <td style="padding: 8px 0;"><span style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${params.serviceName || "General Inquiry"}</span></td>
            </tr>
          </table>
          <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #0284c7; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #475569;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap;">${params.message}</p>
          </div>
          <p style="margin-bottom: 0; font-size: 12px; color: #94a3b8;">Lead ID: ${params.leadId}</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"ExpatDesk OS" <${smtpUser}>`,
      to: adminEmail,
      subject,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error("[Notification] Error sending email notification:", error);
    return false;
  }
}

/**
 * Send WhatsApp notification via Meta Cloud API when a new lead is submitted
 */
export async function sendLeadWhatsAppNotification(
  params: SendLeadNotificationParams,
): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipientNumber = process.env.WHATSAPP_ADMIN_RECIPIENT_NUMBER;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!token || !phoneNumberId || !recipientNumber) {
    console.warn(
      "[Notification] WhatsApp Cloud API environment variables not configured. Skipping WhatsApp notification.",
    );
    return false;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    // If templateName is specified, send official template message
    let payload: Record<string, unknown>;

    if (templateName) {
      payload = {
        messaging_product: "whatsapp",
        to: recipientNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.serviceName || "General Inquiry" },
                { type: "text", text: params.name },
                { type: "text", text: params.phone || params.email },
              ],
            },
          ],
        },
      };
    } else {
      // Fallback text message (usable within 24h conversation window or testing)
      const textMessage = `🔔 *New ExpatDesk Lead Request*\n\n*Service:* ${params.serviceName || "General Inquiry"}\n*Client:* ${params.name}\n*Email:* ${params.email}\n*Phone:* ${params.phone || "N/A"}\n*Language:* ${(params.preferredLang || "en").toUpperCase()}\n\n*Message:*\n${params.message}`;
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientNumber,
        type: "text",
        text: { preview_url: false, body: textMessage },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Notification] WhatsApp API error response:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Notification] Error sending WhatsApp notification:", error);
    return false;
  }
}
