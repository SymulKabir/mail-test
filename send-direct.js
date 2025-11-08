const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const { DKIMSign } = require('dkim-signer');

// CONFIGURATION
const FROM_EMAIL = 'symul@somacharnews.com';
const TO_EMAIL = 'saimonpranta@gmail.com';
const SUBJECT = 'Test email from Node.js SMTP';
const BODY = 'Hello! This is a test email sent directly from Node.js without Postfix.';
const SMTP_HOST = 'smtp.gmail.com'; // or any target SMTP host if relaying
const SMTP_PORT = 587;

// DKIM CONFIG
const DKIM_DOMAIN = 'somacharnews.com';
const DKIM_SELECTOR = 'default';
const DKIM_PRIVATE_KEY = fs.readFileSync('/etc/opendkim/keys/somacharnews.com/default.private', 'utf-8');

// Create raw email
function buildRawEmail() {
  const messageId = `<${crypto.randomBytes(16).toString('hex')}@${DKIM_DOMAIN}>`;
  const date = new Date().toUTCString();

  let raw = '';
  raw += `From: ${FROM_EMAIL}\r\n`;
  raw += `To: ${TO_EMAIL}\r\n`;
  raw += `Subject: ${SUBJECT}\r\n`;
  raw += `Date: ${date}\r\n`;
  raw += `Message-ID: ${messageId}\r\n`;
  raw += `MIME-Version: 1.0\r\n`;
  raw += `Content-Type: text/plain; charset=utf-8\r\n`;
  raw += `\r\n`;
  raw += `${BODY}\r\n`;

  return raw;
}

// DKIM Sign the email
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

// Send email directly via SMTP
async function sendEmail() {
  const rawEmail = buildRawEmail();
  const signedEmail = dkimSign(rawEmail);

  const client = net.createConnection(SMTP_PORT, SMTP_HOST, () => {
    console.log('Connected to SMTP server');
  });

  client.setEncoding('utf-8');

  client.on('data', (data) => {
    process.stdout.write(data);

    if (data.includes('220')) {
      client.write(`EHLO ${DKIM_DOMAIN}\r\n`);
    } else if (data.includes('250') && !data.includes('STARTTLS')) {
      client.write('STARTTLS\r\n');
    } else if (data.includes('220 Ready to start TLS')) {
      // Upgrade connection to TLS if required
      const tls = require('tls');
      const secureClient = tls.connect(
        { socket: client, servername: SMTP_HOST },
        () => {
          secureClient.write(`EHLO ${DKIM_DOMAIN}\r\n`);
          secureClient.write(`MAIL FROM:<${FROM_EMAIL}>\r\n`);
          secureClient.write(`RCPT TO:<${TO_EMAIL}>\r\n`);
          secureClient.write('DATA\r\n');
          secureClient.write(`${signedEmail}\r\n.\r\n`);
          secureClient.write('QUIT\r\n');
        }
      );
      secureClient.setEncoding('utf-8');
      secureClient.on('data', (d) => process.stdout.write(d));
    }
  });

  client.on('end', () => {
    console.log('SMTP connection closed');
  });

  client.on('error', (err) => {
    console.error('SMTP connection error:', err);
  });
}

sendEmail();
