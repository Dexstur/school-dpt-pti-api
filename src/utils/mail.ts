import nodeMailer from "nodemailer";
import dev from "./log";
import { config } from "dotenv";

config();
interface EmailOptions {
  receipient: string;
  subject: string;
  content: string;
  html?: boolean;
}
const user = process.env.GMAIL || "";

const pass = process.env.GMAIL_PASSWORD || "";
const host = process.env.GMAIL_HOST || "";
const port = Number(process.env.GMAIL_PORT) || "";

const transporter = nodeMailer.createTransport({
  host: host,
  port: Number(port),
  secure: true,
  auth: {
    user,
    pass,
  },
});

function sendMail(options: EmailOptions) {
  const mailOptions = {
    from: user,
    to: options.receipient,
    subject: options.subject,
    text: options.html ? "" : options.content,
    html: options.html ? options.content : "",
  };

  let result = false;
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error.message);
    } else {
      result = true;
      dev.log("Email sent: " + info.response);
    }
  });

  return result;
}

export default sendMail;
