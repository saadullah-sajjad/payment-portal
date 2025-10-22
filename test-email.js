// Quick test script for SendGrid Email Service
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

async function testEmail() {
  console.log('Testing SendGrid Email Configuration...\n');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SG.' + process.env.SENDGRID_API_KEY.slice(3, 7) + '...' : 'NOT SET');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'noreply@cirqley.com (default)');
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ Error: SENDGRID_API_KEY not set in .env.local');
    process.exit(1);
  }

  try {
    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log('Sending test email via SendGrid...');
    const msg = {
      to: 'saadullah@cirqley.com',
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@cirqley.com',
      subject: 'Test Email from Payment Portal (SendGrid)',
      text: 'If you receive this, your SendGrid configuration is working correctly!',
      html: `
        <h1>✅ SendGrid Success!</h1>
        <p>Your SendGrid email configuration is working correctly.</p>
        <p><strong>Service:</strong> SendGrid</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    };

    const response = await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    console.log('\nCheck saadullah@cirqley.com inbox!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response body:', error.response.body);
      console.error('Response headers:', error.response.headers);
    }
    if (error.code === 401) {
      console.error('\n🔧 Fix: Your SendGrid API Key is invalid.');
      console.error('   1. Go to: https://app.sendgrid.com/settings/api_keys');
      console.error('   2. Create a new API Key with "Mail Send" permissions');
      console.error('   3. Update SENDGRID_API_KEY in .env.local');
    }
    process.exit(1);
  }
}

testEmail();