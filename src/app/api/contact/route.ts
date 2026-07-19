import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Configure your SMTP settings via environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // e.g., smtp.gmail.com or mail.workflownets.com
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // e.g., your email
        pass: process.env.SMTP_PASS, // e.g., your app password
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_USER || 'no-reply@workflownets.com'}>`, // Sender address
      replyTo: email,
      to: 'support@workflownets.com', // Receiver email
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <br />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    // If SMTP_USER is not set, we just log it in development to avoid crashing if they test locally without env vars
    if (!process.env.SMTP_USER) {
      console.warn('SMTP_USER is not set. Simulating email sending.');
      console.log('Would have sent email:', mailOptions);
      return NextResponse.json({ success: true, simulated: true });
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
