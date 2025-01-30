import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

import { secret } from '@aws-amplify/backend'

const SENDGRID_API_KEY = secret('SENDGRID_API_KEY').toString();

sgMail.setApiKey(SENDGRID_API_KEY);

export async function POST(req: Request) {
  try {
    const { subject, message,userEmail  } = await req.json();

    const msg = {
      to: 'support@learn4less.ca',
      from: 'support@learn4less.ca', // Replace with your verified SendGrid email
      replyTo: userEmail,
      subject: subject,
      text: message,
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}