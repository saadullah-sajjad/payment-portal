import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html, attachment, filename } = await request.json();

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject' },
        { status: 400 }
      );
    }

    // Send email using SendGrid service
    const success = await emailService.sendEmail({
      to,
      subject,
      text: text || '',
      html: html || '',
      attachment: attachment ? {
        content: attachment,
        filename: filename || "receipt.pdf",
        type: "application/pdf",
        disposition: "attachment",
      } : undefined,
    });

    if (success) {
      console.log(`Email sent successfully to ${to}`);
      return NextResponse.json({ success: true });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}