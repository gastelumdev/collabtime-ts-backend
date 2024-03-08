import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { Response } from "express";

interface IProps {
  email: string | string[];
  subject: string;
  payload: any;
  template: string;
  res?: Response;
  // cb: any;
}

interface IPayload {
  name: string;
  link?: string;
}

const sendEmail = async ({ email, subject, payload, template, res }: IProps, cb: any) => {
  console.log({ email })
  try {
    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // naturally, replace both with your real credentials or an application-specific password
      },
    });

    console.log(email, subject, payload, template);

    const source = fs.readFileSync(path.join(path.resolve() + "/utils", template), "utf8");
    const compiledTemplate = handlebars.compile(source);
    const options = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: compiledTemplate(payload),
    };

    // return {options: options(), transporter}
    if (email !== "") {
      console.log({ email })
      transporter.sendMail(options, (error: any, info: any) => {
        if (error) {
          throw new Error(error);
        } else {
          // res.status(200).json({
          //     success: true,
          // });
          cb(res);
        }
      });
    }


  } catch (error) {
    console.log(error)
  }
};

/*
Example:
sendEmail(
  "youremail@gmail.com,
  "Email subject",
  { name: "Eze" },
  "./templates/layouts/main.handlebars"
);
*/

export default sendEmail;