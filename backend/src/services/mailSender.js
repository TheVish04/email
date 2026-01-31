import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

function createTransporter() {
    if (transporter) return transporter;
    const { smtp } = config;
    if (!smtp.user || !smtp.pass) return null;

    transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465, // true for 465, false for other ports
        auth: {
            user: smtp.user,
            pass: smtp.pass,
        },
    });
    return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
    const mailer = createTransporter();
    if (!mailer) {
        throw new Error('SMTP credentials not configured');
    }

    const info = await mailer.sendMail({
        from: config.smtp.user, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html, // html body
    });

    console.log('[Mailer] Message sent: %s', info.messageId);
    return info;
}
