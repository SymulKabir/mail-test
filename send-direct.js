const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const { DKIMSign } = require('dkim-signer');

const DKIM_DOMAIN = 'somacharnews.com';
const DKIM_SELECTOR = 'default';
const DKIM_PRIVATE_KEY = fs.readFileSync('/etc/opendkim/keys/somacharnews.com/default.private', 'utf-8');

function buildRawEmail(from, to, subject, body) {
  const messageId = `<${crypto.randomBytes(16).toString('hex')}@${DKIM_DOMAIN}>`;
  const date = new Date().toUTCString();

  let raw = '';
  raw += `From: ${from}\r\n`;
  raw += `To: ${to}\r\n`;
  raw += `Subject: ${subject}\r\n`;
  raw += `Date: ${date}\r\n`;
  raw += `Message-ID: ${messageId}\r\n`;
  raw += `MIME-Version: 1.0\r\n`;
  raw += `Content-Type: text/plain; charset=utf-8\r\n`;
  raw += `\r\n`;
  raw += `${body}\r\n`;

  return raw;
}

function dkimSign(rawEmail) {
  const options = {
    privateKey: DKIM_PRIVATE_KEY,
    keySelector: DKIM_SELECTOR,
    domainName: DKIM_DOMAIN,
    headerFieldNames: 'from:to:subject:date:message-id',
  };
  const dkimHeader = DKIMSign(rawEmail, options);
  return `DKIM-Signature: ${dkimHeader}\r\n${rawEmail}`;
}

function sendDirectMail({ from, to, subject, body, smtpHost = 'localhost', smtpPort = 25 }) {
  return new Promise((resolve, reject) => {
    const rawEmail = buildRawEmail(from, to, subject, body);
    const signedEmail = dkimSign(rawEmail);

    const client = net.createConnection(smtpPort, smtpHost, () => {
      console.log('Connected to SMTP server');
    });

    client.setEncoding('utf-8');

    client.on('data', (data) => {
      process.stdout.write(data);

      if (data.includes('220')) {
        client.write(`EHLO ${DKIM_DOMAIN}\r\n`);
      } else if (data.includes('250') && !data.includes('STARTTLS')) {
        client.write(`MAIL FROM:<${from}>\r\n`);
        client.write(`RCPT TO:<${to}>\r\n`);
        client.write('DATA\r\n');
        client.write(`${signedEmail}\r\n.\r\n`);
        client.write('QUIT\r\n');
      } else if (data.includes('221')) {
        client.end();
        resolve('Email sent successfully');
      }
    });

    client.on('end', () => console.log('SMTP connection closed'));
    client.on('error', (err) => reject(err));
  });
}

module.exports = sendDirectMail;
