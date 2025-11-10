const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");

const SSL_KEY_PATH = "/etc/letsencrypt/live/mail.somacharnews.com/privkey.pem";
const SSL_CERT_PATH = "/etc/letsencrypt/live/mail.somacharnews.com/fullchain.pem";

let sslOptions = {};
try {
  sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };
} catch (err) {
    console.error("⚠️ SSL files not found:", err.message);
}

// Factory function for creating SMTP servers
const createSMTPServer = (port, options = {}) =>
  new SMTPServer({
    secure: options.secure || false,
    key: options.secure ? sslOptions.key : undefined,
    cert: options.secure ? sslOptions.cert : undefined,
    authOptional: port === 25,
    onConnect(session, callback) {
      console.log(`[${port}] Connection from ${session.remoteAddress}`);
      callback();
    },
    onAuth(auth, session, callback) {
      if (auth.username === "symul@micple.com" && auth.password === "YourPasswordHere") {
        return callback(null, { user: auth.username });
      }
      return callback(new Error("Invalid username or password"));
    },
    onData(stream, session, callback) {
      console.log(`[${port}] Receiving mail...`);
      simpleParser(stream, (err, parsed) => {
        if (err) {
          console.error("Error parsing email:", err);
          return callback(err);
        }
        console.log("From:", parsed.from.text);
        console.log("To:", parsed.to.text);
        console.log("Subject:", parsed.subject);
        console.log("Body:", parsed.text);
        fs.appendFileSync(
          path.join(__dirname, "emails.log"),
          `\n----- ${new Date().toISOString()} [${port}] -----\nFROM: ${parsed.from.text}\nTO: ${parsed.to.text}\nSUBJECT: ${parsed.subject}\nBODY: ${parsed.text}\n`
        );
        callback();
      });
    },
    disabledCommands: port === 25 ? ["AUTH"] : [],
  });

// Port 25 — Incoming (MTA → MTA)
createSMTPServer(25).listen(25, () => console.log("✅ SMTP inbound (25) ready"));

// Port 465 — SMTPS (SSL/TLS)
createSMTPServer(465, { secure: true }).listen(465, () => console.log("✅ SMTPS (465) ready"));

// Port 587 — STARTTLS submission
createSMTPServer(587).listen(587, () => console.log("✅ Submission (587) ready"));
