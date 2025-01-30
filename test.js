import sgMail from '@sendgrid/mail';
import { secret } from '@aws-amplify/backend';

const testSend = async () => {
  try {
    const key = secret('SENDGRID_API_KEY').toString().trim();
    console.log('Key details:', {
      length: key.length,
      startsWithSG: key.startsWith('SG.'),
      firstFiveChars: key.substring(0, 5)
    });

    sgMail.setApiKey(key);

    const msg = {
      to: 'support@learn4less.ca',
      from: 'support@learn4less.ca',
      subject: 'Test Email',
      text: 'This is a test email'
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error:', error);
  }
};

testSend();