const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '127.0.0.1', // your Node.js SMTP server
  port: 26,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});


transporter.sendMail({
  from: '"Symul" <symul@somacharnews.com>',
  to: 'saimonpranta@gmail.com',
  subject: 'Hello from Node.js SMTP Server',
  text: 'This is a test email sent through Node.js SMTP server.',
}, (err, info) => {
  if (err) return console.error(err);
  console.log('✅ Mail sent:', info.response);
});