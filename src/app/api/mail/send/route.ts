import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, text, html, attachments } = body;

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and text are required' },
        { status: 400 }
      );
    }

    const result = await sendMail({ to, subject, text, html, attachments });

    return NextResponse.json(
      { message: 'Email sent successfully', ...result },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while sending the email';
    console.error('Email API Error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
