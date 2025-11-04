const nodemailer = require("nodemailer");

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: "mail.somacharnews.com",
      port: 587,
      secure: false,
      auth: { user: "you@somacharnews.com", pass: "YOUR_PASSWORD" },
      tls: { rejectUnauthorized: false }
    });

    const info = await transporter.sendMail({
      from: '"Symul" <you@somacharnews.com>',
      to: "saimonprana@gmail.com",
      subject: "Test from my mail server",
      text: "Hello from my mail server!"
    });

    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Error sending mail:", error);
  }
})();
