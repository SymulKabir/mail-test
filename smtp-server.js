// smtp-server.js
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const dns = require('dns');

const server = new SMTPServer({
  authOptional: true,
  onConnect(session, callback) {
    console.log(`New connection from ${session.remoteAddress}`);
    callback();
  },
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) return callback(err);

      const { from, to, subject, text, html } = parsed;
      console.log('Received email:', subject, 'From:', from.text);

      // Forward email to external SMTP server (like Gmail) using Nodemailer
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com', // Replace with your sending SMTP server
          port: 587,
          secure: false,
          auth: {
            user: 'your@gmail.com', // SMTP username
            pass: 'your-app-password' // SMTP password / app password
          }
        });

        await transporter.sendMail({
          from: from.text,
          to: to.text,
          subject,
          text,
          html
        });

        console.log('✅ Forwarded email successfully');
      } catch (e) {
        console.error('Error forwarding email:', e);
      }

      callback();
    });
  }
});

server.listen(25, () => console.log('SMTP server listening on port 25'));
