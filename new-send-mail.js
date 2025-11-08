const sendDirectMail = require('./send-direct');

(async () => {
  try {
    const result = await sendDirectMail({
      from: 'symul@somacharnews.com',
      to: 'saimonpranta@gmail.com',
      subject: 'Hello from Node.js Direct SMTP',
      body: 'This is a test email sent fully via Node.js without Postfix.',
      smtpHost: 'localhost', // your Node.js SMTP server host
      smtpPort: 25           // your Node.js SMTP server port
    });

    console.log(result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
})();
