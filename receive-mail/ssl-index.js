const { SMTPServer } = require("smtp-server");
const fs = require("fs");

const server = new SMTPServer({
  secure: true, // Force SSL (port 465)
//   key: fs.readFileSync("/etc/letsencrypt/live/mail.micple.com/privkey.pem"),
//   cert: fs.readFileSync("/etc/letsencrypt/live/mail.micple.com/fullchain.pem"),
  authOptional: true,
  onData(stream, session, callback) {
    console.log("Mail received");
    stream.on("end", callback);
  },
});

server.listen(465, () => {
  console.log("Secure SMTP Server running on port 465 (SSL)");
});
