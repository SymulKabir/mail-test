const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.somacharnews.com",
  port: 587, // or 25 if 587 blocked
  secure: false, // use TLS if true
  auth: {
    user: "symul@somacharnews.com", // your SMTP email
    pass: "your-email-password",    // your SMTP password
  },
});

const mailOptions = {
  from: "symul@somacharnews.com",
  to: "saimonpranta@gmail.com",
  subject: "Test Email from Production",
  text: "Hello! This is a test email sent from my production server.",
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) console.error("Error sending email:", err);
  else console.log("Email sent successfully:", info.response);
});
