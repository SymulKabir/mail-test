// smtp-server-custom.js
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const dns = require('dns');

// Helper: Get MX records
const getMxHost = async (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) return reject(err || 'No MX found');
      // sort by priority
      addresses.sort((a, b) => a.priority - b.priority);
      resolve(addresses[0].exchange);
    });
  });
};

// Start SMTP server
const server = new SMTPServer({
  authOptional: true,
  onConnect(session, callback) {
    console.log(`🔗 New connection from ${session.remoteAddress}`);
    callback();
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
      console.log(`✉️  Received email from ${from.text} to ${to.text}: ${subject}`);

      try {
        // Send email directly to recipient MX
        const recipientDomain = to.value[0].address.split('@')[1];
        const mxHost = await getMxHost(recipientDomain);

        const transporter = nodemailer.createTransport({
          host: mxHost,
          port: 25,
          secure: false,
          tls: { rejectUnauthorized: false } // allow self-signed TLS
        });

        await transporter.sendMail({
          from: from.text,
          to: to.text,
          subject,
          text,
          html,
          attachments
        });

        console.log(`✅ Email sent directly to ${mxHost}`);
      } catch (e) {
        console.error('❌ Error sending email:', e);
      }

      callback();
    });
  }
});

server.listen(26, () => console.log('🚀 Custom SMTP server listening on port 25'));
server.on('error', (err) => console.error('⚠️ SMTP Server error:', err));
