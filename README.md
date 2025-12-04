## Custom Node.js SMTP Server Documentation

### 1. Overview
- This setup allows you to:
Send emails directly from your domain to recipient servers (Gmail, Outlook, etc.) without using external SMTP relays.

- Receive emails from other servers directly into your Node.js server.

- Store or process received emails programmatically.

- Use your custom SMTP server, similar to Postfix, entirely in Node.js.

### 2. Requirements

- Ubuntu/Debian or any Linux server
- Public IP address
- Node.js v14.21.3 (v18+ recommended)
- Open ports:
  - 25 (SMTP)
  - 587 (optional for submission)
  - 26 (custom server for testing)
- Access to your domain’s DNS

**Node.js Dependencies**

Install the required Node.js modules:

```bash
npm install smtp-server mailparser nodemailer axios form-data
```
- `smtp-server`: To create an SMTP server  
- `mailparser`: To parse incoming emails  
- `nodemailer`: To send emails to other MX servers  
- `axios` + `form-data`: Optional, for forwarding received emails to your backend


### 3. File Structure
```perl
/var/websites/mail-test
├── package.json
├── node_modules
├── receive-mail
│   └── index.js            # Receives incoming emails
├── send-mail
│   ├── smtp-server-custom.js  # Your Node.js SMTP server for sending emails
│   └── send-mail.js           # Client script to send emails via your SMTP server
└── README.md
```

### 4. DNS Setup

To ensure your emails are trusted and delivered to inboxes, configure DNS for your domain:

#### a) MX Record
Points to your SMTP server.

```bash
Type: MX
Host: @
Value: mail.somacharnews.com
Priority: 10
TTL: 3600

```
Then Verify
```bash
dig MX somacharnews.com +short
```
Your can see `10 mail.somacharnews.com` like this result

### b) A Record
Maps your mail subdomain to your server’s IP.

```text
Type: A
Host: mail
Value: <YOUR_SERVER_PUBLIC_IP>
TTL: 3600
```
Then Verify
```bash
dig A mail.somacharnews.com +short
```
Your can see `<YOUR_SERVER_PUBLIC_IP>` like this result


### c) SPF Record
Authorizes your server to send emails.

```text
Type: TXT
Host: @
Value: "v=spf1 a mx ip4:<YOUR_SERVER_PUBLIC_IP> -all"

```
Then Verify
```bash
dig TXT somacharnews.com +short
```
Your can see `"v=spf1 a mx ip4:<YOUR_SERVER_PUBLIC_IP> -all"` like this result

### d) DKIM Record (Optional but recommended)
Sign emails for verification.

#### Generate DKIM keys:
```bash
mkdir -p /etc/opendkim/keys/somacharnews.com

openssl genrsa -out /etc/opendkim/keys/somacharnews.com/default.private 2048

openssl rsa -in /etc/opendkim/keys/somacharnews.com/default.private -pubout -out /etc/opendkim/keys/somacharnews.com/default.public

cat /etc/opendkim/keys/somacharnews.com/default.public
```
Copy the `default.public` file output

#### Add TXT record in DNS:
```text
Type: TXT
Host: default._domainkey
Value: "v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>"
```

#### DMARC Record (Optional)
```text
Type: TXT
Host: _dmarc
Value: "v=DMARC1; p=none; rua=mailto:postmaster@somacharnews.com"
```

#### Set PTR Record (Reverse DNS)
You cannot set PTR in your DNS panel — it must be done by your server provider or VPS host (e.g., DigitalOcean, AWS, Hetzner, etc.).

✅ Ask your hosting provider support:
```text
“Please set the reverse DNS (PTR) record for my IP 103.251.247.158 to mail.somacharnews.com.”
```
### 5. SMTP Server Setup
#### a) Receiving Emails
`receive-mail/index.js` handles receiving emails on port `25`.
Key points:

- Uses `smtp-server` to accept connections

- Uses `mailparser`to parse incoming email

- Can store emails locally or send to backend API

- Accepts authenticated and unauthenticated connections

```js
const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs");

const server = new SMTPServer({
  allowInsecureAuth: true,
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) return callback(err);
      console.log("Received email from:", parsed.from.text, "Subject:", parsed.subject);
      callback();
    });
  }
});

server.listen(25, () => console.log("SMTP server listening on port 25"));
```

#### b) Sending Emails Directly

`send-mail/smtp-server-custom.js` sends emails directly to recipient MX servers.

Key points:

- Looks up MX records of recipient domains

- Sends emails via `nodemailer` to that MX

Works for Gmail, Outlook, Yahoo, etc.

Port `26` used as example; you can use `25` for production

```js
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const dns = require('dns');

const getMxHost = async (domain) => {
  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || !addresses.length) return reject(err || "No MX found");
      addresses.sort((a, b) => a.priority - b.priority);
      resolve(addresses[0].exchange);
    });
  });
};

const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream, async (err, parsed) => {
      if (err) return callback(err);
      const { from, to, subject, text, html, attachments } = parsed;
      const recipientDomain = to.value[0].address.split('@')[1];
      const mxHost = await getMxHost(recipientDomain);

      const transporter = nodemailer.createTransport({
        host: mxHost,
        port: 25,
        secure: false,
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({ from: from.text, to: to.text, subject, text, html, attachments });
      console.log(`Email sent directly to ${mxHost}`);
      callback();
    });
  }
});

server.listen(26, () => console.log("Custom SMTP server listening on port 26"));
```
c) Sending Emails via your Node.js SMTP server

`send-mail/send-mail.js` connects to your custom SMTP server and sends emails:

```js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 26,
  secure: false,
  tls: { rejectUnauthorized: false }
});

transporter.sendMail({
  from: '"Symul" <symul@somacharnews.com>',
  to: 'recipient@gmail.com',
  subject: 'Test email',
  text: 'Hello! This is a test email from custom SMTP server.'
}, (err, info) => {
  if (err) return console.error(err);
  console.log('Mail sent:', info.response);
});
```

### 6. Firewall & Ports
Allow ports 25 and 26 in firewall:

```bash
sudo ufw allow 25/tcp
sudo ufw allow 26/tcp
sudo ufw reload
```
### 6. Testing DNS & Authentication

#### a) Check MX Record
```bash
dig MX somacharnews.com +short
#OR
dig MX 72.60.108.1 +short

```

#### b) Check SPF
```bash
dig TXT somacharnews.com +short
#OR
dig TXT 72.60.108.1 +short

```
#### c) Check DKIM
```bash
dig TXT default._domainkey.somacharnews.com +short
 
```

#### d) Check reverse DNS (PTR)
```bash
dig -x 103.251.247.158 +short
```

Expected output:

```
mail.somacharnews.com.
```

### 8. Notes on Deliverability
- Many email providers (Gmail, Outlook) check SPF, DKIM, DMARC. If these are missing, emails may go to Spam.

- Using direct MX delivery is fragile: some servers may reject emails from dynamic IPs or new domains.

- Recommended: Use a static IP, proper PTR record, and TLS certificates for your domain.

### 9. Optional Enhancements

- Add DKIM signing to outgoing emails (nodemailer supports DKIM).

- Store incoming emails to a database.

- Add authentication for sending emails.

- TLS/SSL support for secure submission (port 465).




