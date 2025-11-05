const dns = require("dns");
const net = require("net");
const { promisify } = require("util");

const resolveMx = promisify(dns.resolveMx);

const sendMailDirect = async (from, to, subject, message) => {
  try {
    const domain = to.split("@")[1];
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new Error(`No MX records found for domain: ${domain}`);
    }

    mxRecords.sort((a, b) => a.priority - b.priority);
    const mxHost = mxRecords[0].exchange;
    console.log(`Connecting to MX: ${mxHost}`);

    const socket = net.createConnection(25, mxHost);

    socket.on("connect", () => {
      console.log("✅ Connected to MX server");
    });

    let buffer = "";
    socket.on("data", (data) => {
      buffer += data.toString();
      if (buffer.endsWith("\n")) processResponse(buffer);
    });

    const processResponse = (response) => {
      console.log("MX Response:", response.trim());

      if (response.startsWith("220")) {
        socket.write(`HELO mail.somacharnews.com\r\n`);
      } else if (response.startsWith("250") && response.includes("HELO")) {
        socket.write(`MAIL FROM:<${from}>\r\n`);
      } else if (response.startsWith("250") && response.includes("Sender")) {
        socket.write(`RCPT TO:<${to}>\r\n`);
      } else if (response.startsWith("250") && response.includes("Recipient")) {
        socket.write(`DATA\r\n`);
      } else if (response.startsWith("354")) {
        socket.write(
          `Subject: ${subject}\r\nFrom: ${from}\r\nTo: ${to}\r\n\r\n${message}\r\n.\r\n`
        );
      } else if (response.startsWith("250") && response.includes("OK")) {
        socket.write(`QUIT\r\n`);
        console.log("✅ Mail sent successfully!");
        socket.end();
      }
      buffer = "";
    };

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
  } catch (err) {
    console.error("Error sending mail:", err);
  }
};

const main = async () => {
  await sendMailDirect(
    "symul@somacharnews.com",
    "symul23@somacharnews.com",
    "Test Mail from Node.js MX",
    "Hello! This is a test message sent directly from my Node.js SMTP sender."
  );
};

main();
