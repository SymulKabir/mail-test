const nodemailer = require("nodemailer");

const sendMail = async () => {
  try {
    // Create transporter using your mail server
    const transporter = nodemailer.createTransport({
      host: "mail.somacharnews.com",
      port: 587, // use 465 for SMTPS
      secure: false, // true for 465, false for 587 STARTTLS
      auth: {
        user: "symul@somacharnews.com",
        pass: "your_mail_password_here", // use strong password
      },
      tls: {
        rejectUnauthorized: false, // allow self-signed certs (optional)
      },
    });

    // Mail options
    const mailOptions = {
      from: '"Symul Kabir" <symul@somacharnews.com>',
      to: "saimonpranta@gmail.com",
      subject: "Professional Node.js Mail Test",
      text: "Hello! This is a professional test mail sent from my Node.js mail sender.",
      html: "<p>Hello! This is a <b>professional</b> test mail sent from my Node.js mail sender.</p>",
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Mail sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error sending mail:", err);
  }
};

sendMail();
