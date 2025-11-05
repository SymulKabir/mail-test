const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "mail.somacharnews.com", 
//   port: 587,
//   secure: false, // use true for 465
//   auth: {
//     user: "symul@somacharnews.com",
//     pass: "YOUR_PASSWORD",
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "mail.somacharnews.com",
  port: 25,
  secure: false,
  auth: {
    user: "symul@somacharnews.com",
    pass: "YOUR_REAL_PASSWORD", // actual mailbox password
  },
  tls: { rejectUnauthorized: false },
});


const mailOptions = {
  from: '"Symul" <symul@somacharnews.com>',
  to: "saimonpranta@gmail.com",
  subject: "Professional Mail Test",
  text: "Hello! This is a professional test from my Node.js mail server.",
  html: "<p>Hello! This is a <b>professional test</b> from my Node.js mail server.</p>",
  dkim: {
    domainName: "somacharnews.com",
    keySelector: "default",
    privateKey: require("fs").readFileSync("/etc/opendkim/keys/somacharnews.com/default.private"),
  },
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error("Error sending mail:", error);
  }
  console.log("✅ Mail sent:", info.response);
});
