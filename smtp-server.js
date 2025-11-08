// smtp-server.js
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

// Configure your external SMTP relay
const RELAY_SMTP = {
  host: 'smtp.gmail.com',      // External SMTP host
  port: 587,                   // TLS port
  secure: false,               // true for 465, false for 587
  auth: {
    user: 'your@gmail.com',    // Your SMTP username
    pass: 'your-app-password', // Your SMTP password or app password
  }
};

// Start the SMTP server
const server = new SMTPServer({
  authOptional: true, // allow unauthenticated connections
  onConnect(session, callback) {
    console.log(`🔗 New connection from ${session.remoteAddress}`);
    callback();
  },
  onAuth(auth, session, callback) {
    const { username, password } = auth;
    if (username === 'symul@somacharnews.com' && password === 'YOUR_PASSWORD') {
      console.log('✅ Authenticated user:', username);
      return callback(null, { user: username });
    }
    return callback(new Error('Invalid username or password'));
  },
  onMailFrom(address, session, callback) {
    console.log('📩 MAIL FROM:', address.address);
    callback();
  },
  onRcptTo(address, session, callback) {
    console.log('📬 RCPT TO:', address.address);
    callback();
  },
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) return callback(err);

      const { from, to, subject, text, html, attachments } = parsed;
      console.log('✉️  Received email:', subject, 'From:', from.text);

      // Forward to external SMTP relay
      try {
        const transporter = nodemailer.createTransport(RELAY_SMTP);

        await transporter.sendMail({
          from: from.text,
          to: to.text,
          subject,
          text,
          html,
          attachments
        });

        console.log('✅ Forwarded email successfully');
      } catch (e) {
        console.error('❌ Error forwarding email:', e);
      }

      callback(); // done processing
    });
  }
});

// Listen on port 25 (or 587 if blocked)
const PORT = 25;
server.listen(PORT, () => {
  console.log(`🚀 SMTP server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('⚠️ SMTP Server error:', err);
});
