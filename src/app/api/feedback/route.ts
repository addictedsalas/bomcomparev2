import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_2QBB2M1u_DtsVdMs2427eLpSLwa2EhokG');

interface AttachmentData {
  name: string;
  size: number;
  type: string;
  content?: string;
}

interface FeedbackData {
  type: 'bug' | 'improvement';
  email: string;
  subject: string;
  description: string;
  submissionId: string;
  attachments: AttachmentData[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      email,
      subject,
      description,
      submissionId,
      attachments
    }: FeedbackData = body;

    // Create email content
    const typeText = type === 'bug' ? 'Bug Report' : 'Feature Request';
    const emailSubject = `${typeText} #${submissionId}: ${subject}`;
    
    // Create HTML email body
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1b1e; color: #ffffff; border-radius: 8px;">
        <div style="border-left: 4px solid #f36f27; padding-left: 20px; margin-bottom: 30px;">
          <h2 style="color: #f36f27; margin: 0; font-size: 24px;">${typeText} #${submissionId}</h2>
          <p style="color: #cccccc; margin: 5px 0 0 0;">BOM Comparison Tool Feedback</p>
        </div>
        
        <div style="background-color: #2a2b2e; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #f36f27; margin-top: 0;">Submission Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #cccccc; width: 120px;"><strong>Submitted by:</strong></td>
              <td style="padding: 8px 0; color: #ffffff;">${email || 'Anonymous'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #ffffff;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #cccccc;"><strong>ID:</strong></td>
              <td style="padding: 8px 0; color: #f36f27; font-family: monospace;">#${submissionId}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #2a2b2e; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #f36f27; margin-top: 0;">Subject</h3>
          <p style="color: #ffffff; font-size: 16px; margin: 0;">${subject}</p>
        </div>

        <div style="background-color: #2a2b2e; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #f36f27; margin-top: 0;">Description</h3>
          <div style="color: #ffffff; line-height: 1.5; white-space: pre-wrap;">${description}</div>
        </div>

        ${attachments?.length > 0 ? `
        <div style="background-color: #2a2b2e; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #f36f27; margin-top: 0;">Attachments (${attachments.length})</h3>
          <ul style="color: #ffffff; margin: 0; padding-left: 20px;">
            ${attachments.map((f: AttachmentData) => `<li>${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)</li>`).join('')}
          </ul>
          <p style="color: #90EE90; font-size: 12px; margin-top: 15px; font-style: italic;">
            ✓ Files are attached to this email and can be downloaded directly.
          </p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #444; padding-top: 20px; margin-top: 30px;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Submitted from BOM Comparison Tool<br>
            Timestamp: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    // Prepare attachments for Resend (convert base64 to buffer)
    const resendAttachments = attachments?.map((file: AttachmentData) => {
      if (file.content) {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = file.content.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        return {
          filename: file.name,
          content: buffer,
          contentType: file.type
        };
      }
      return null;
    }).filter((attachment) => attachment !== null) as Array<{
      filename: string;
      content: Buffer;
      contentType: string;
    }>;

    // Send email using Resend
    const emailData: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
      }>;
    } = {
      from: 'onboarding@resend.dev',
      to: 'salas@ionq.co',
      subject: emailSubject,
      html: emailHtml
    };

    // Add attachments if any (Resend supports up to 40MB total)
    if (resendAttachments.length > 0) {
      emailData.attachments = resendAttachments;
    }

    const emailResponse = await resend.emails.send(emailData);

    console.log('Email sent successfully:', emailResponse);

    return NextResponse.json({ 
      success: true, 
      submissionId,
      message: 'Feedback submitted successfully',
      emailId: emailResponse.data?.id
    });

  } catch (error) {
    console.error('Error sending feedback email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}