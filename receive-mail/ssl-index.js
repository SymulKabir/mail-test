const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data"); // Import FormData module
const {  BACKEND_URL } = require("./src/shared/constants/constant");

const server = new SMTPServer({
  allowInsecureAuth: true,
  authOptional: true,
  onAuth(auth, session, callback) {
    console.log("Hello from onAut section")
    const { username, password } = auth;
    if (username === "symul@somacharnews.com" && password === "YOUR_PASSWORD") {
      return callback(null, { user: username });
    } else {
      return callback(new Error("Invalid username or password"));
    }
  },
  onConnect(session, cb) {
    console.log("From onConnect method, session ID: ", session.id);
    cb();
  },
  onMailFrom(address, session, cb) {
    console.log(`From onMailFrom method, mail address: ${address.address}`);
    cb();
  },
  onRcptTo(address, session, cb) {
    console.log(`From onRcptTo method, mail address: ${address.address}`);
    cb();
  },
  onData(stream, session, callback) {
    console.log("Hello form onData")
    simpleParser(stream, async (err, parsed) => {
      if (err) {
        console.error("Error parsing email:", err);
        return callback(err);
      }

      try {
        const {
          messageId,
          from,
          to,
          bcc,
          cc,
          subject,
          text,
          textAsHtml,
          html,
          attachments,
          date,
        } = parsed;

        // Prepare email data as an object
        const mailObject = {
          messageId,
          from,
          to,
          bcc,
          cc,
          subject,
          text,
          textAsHtml,
          html,
          date,
        };

        const formData = new FormData();
        formData.append("data", JSON.stringify(mailObject));

        if (attachments && attachments.length) {
          attachments.forEach((file, index) => {
            const buffer = Buffer.from(file.content, "base64");
            formData.append(`partId-${file.partId}`, buffer, {
              filename: file.filename,
              contentType: file.contentType,
            });
          });
        }

        // Send the parsed email data to the backend
        // const response = await axios.post(
        //   `${BACKEND_URL}/mail/save-mail`,
        //   formData,
        //   {
        //     headers: formData.getHeaders(),
        //   }
        // );

        // console.log("Email saved successfully:", response.data);
        callback(); // Signal that the email was processed
      } catch (error) {
        console.error("Error in processing email:", error);
        callback(error); // Pass the error to the SMTP client
      }
    });
  },
});
const PORT = 465;
// Start the SMTP server
server.listen(PORT, () => {
  console.log(`Mail server is listening on PORT: ${PORT}`);
});

server.on("error", (err) => {
  console.error("SMTP Server error:", err);
});
