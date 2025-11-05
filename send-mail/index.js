import dns from "dns/promises";
import net from "net";
import tls from "tls";
import fs from "fs";
import { DKIMSign } from "nodemailer/lib/dkim";

const sendCommand = (socket, command) => {
  return new Promise((resolve) => {
    socket.write(command + "\r\n");
    console.log(">>", command);
    socket.once("data", (data) => {
      console.log("<<", data.toString().trim());
      resolve(data.toString());
    });
  });
};

const sendMail = async ({ from, to, subject, body }) => {
  const domain = to.split("@")[1];
  const mxRecords = await dns.resolveMx(domain);
  const mxHost = mxRecords.sort((a, b) => a.priority - b.priority)[0].exchange;

  console.log(`Connecting to Gmail MX: ${mxHost}`);

  const socket = net.connect(25, mxHost);

  return new Promise((resolve, reject) => {
    socket.once("data", async (data) => {
      console.log("<<", data.toString().trim());

      const write = async (cmd) => {
        socket.write(cmd + "\r\n");
        console.log(">>", cmd);
        return new Promise((res) => {
          socket.once("data", (data) => {
            console.log("<<", data.toString().trim());
            res(data.toString());
          });
        });
      };

      await write(`EHLO mail.somacharnews.com`);
      await write(`STARTTLS`);

      const secureSocket = tls.connect(
        {
          socket,
          host: mxHost,
          servername: mxHost,
          rejectUnauthorized: false,
        },
        async () => {
          console.log("🔐 TLS connection established");

          const tlsSend = (cmd) => {
            secureSocket.write(cmd + "\r\n");
            console.log(">>", cmd);
          };

          const dkimSigner = new DKIMSign({
            domainName: "somacharnews.com",
            keySelector: "default",
            privateKey: fs.readFileSync("/etc/opendkim/keys/somacharnews.com/default.private"),
            headerFieldNames: "from:to:subject:date",
          });

          const messageBody = `Subject: ${subject}\r\nFrom: ${from}\r\nTo: ${to}\r\nDate: ${new Date().toUTCString()}\r\n\r\n${body}\r\n`;

          const dkimHeader = dkimSigner.sign(messageBody);
          const message = `${dkimHeader}\r\n${messageBody}`;

          secureSocket.once("data", async () => {
            tlsSend(`EHLO mail.somacharnews.com`);
          });

          let stage = 0;
          secureSocket.on("data", (data) => {
            const response = data.toString();
            console.log("<<", response.trim());

            if (response.startsWith("250") && stage === 0) {
              tlsSend(`MAIL FROM:<${from}>`);
              stage++;
            } else if (response.startsWith("250") && stage === 1) {
              tlsSend(`RCPT TO:<${to}>`);
              stage++;
            } else if (response.startsWith("250") && stage === 2) {
              tlsSend("DATA");
              stage++;
            } else if (response.startsWith("354") && stage === 3) {
              tlsSend(message + "\r\n.");
              stage++;
            } else if (response.startsWith("250 2.0.0") && stage === 4) {
              tlsSend("QUIT");
              resolve("✅ Mail successfully sent to Gmail");
              secureSocket.end();
            }
          });

          secureSocket.on("error", (err) => reject("❌ TLS Error: " + err.message));
        }
      );
    });

    socket.on("error", (err) => reject("❌ Socket Error: " + err.message));
  });
};

// Example usage
await sendMail({
  from: "symul@somacharnews.com",
  to: "saimonpranta@gmail.com",
  subject: "Fully Working Node.js SMTP Gmail Test",
  body: "This message was sent using direct SMTP relay with TLS and DKIM from somacharnews.com!",
});
