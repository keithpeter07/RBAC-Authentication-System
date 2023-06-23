// eslint-disable-next-line import/no-extraneous-dependencies
import nodemailer from 'nodemailer';
import { Service } from 'typedi';
import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '../.env.example' });
}

@Service()
export default class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_EMAIL_PASS
      }
    });
  }

  private setOptions(to: string, subject: string, text: string | null, html: string | null) {
    return {
      from: process.env.AUTH_EMAIL,
      to,
      subject,
      text,
      html
    };
  }

  async sendMail(options: nodemailer.SendMailOptions) {
    return this.transporter.sendMail(options)
      .then(info => {
        console.log(info);
        return info;
      })
      .catch(error => {
        console.log(error);
        return error;
      });
  }
}
