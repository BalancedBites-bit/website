require('dotenv').config();const nodemailer=require("nodemailer");const transporter=nodemailer.createTransport({service:"gmail",auth:{user:process.env.email,pass:process.env.password,},});const path=require("path");async function sendPaymentConfirmationEmail(email,compressedImageBuffer,name){const mailOptions={from:email,to:process.env.email,subject:"Payment Verification",html:`<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 10px 0;
      }
      .header img {
        max-width: 100px;
      }
      .content {
        text-align: center;
        padding: 20px 0;
      }
      .content img {
        max-width: 100%;
        height: auto;
        border-radius: 10px;
      }
      .footer {
        text-align: center;
        padding: 10px 0;
        color: #888;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payment Confirmation</h1>
      </div>
      <div class="content">
        <p>Yeu have received a payment verification request. Please verify the image and user from the admin panel</p>
      </div>
    </div>
  </body>
  </html>`,attachments:[{filename:name,content:compressedImageBuffer,},],};try{const info=await transporter.sendMail(mailOptions);console.log("Email sent: "+info.response)}catch(error){console.error("Error sending email: ",error)}}
  const sendOTP=(email,otp)=>{const mailOptions={from:process.env.email,to:email,subject:"Your OTP Code",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Your OTP Code</h2>
          <p>Dear User,</p>
          <p>Your OTP code is:</p>
          <h1 style="background: #f2f2f2; padding: 10px; border-radius: 5px;">${otp}</h1>
          <p>This OTP code will expire in 5 minutes. Please use it as soon as possible.</p>
          <p>If you did not request this OTP, please ignore this email.</p>
          <br>
          <p>Best regards,</p>
          <p>Balanced Bites.</p>
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendCounselingSessionRequest=(request)=>{const mailOptions={from:request.email,to:process.env.email,subject:"Counseling Session Request",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Counseling Session Request</h2>
          <p>You have received a request for a counseling session. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Nane:</strong> ${request.fullName}</li>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Date:</strong> ${request.date}</li>
          </ul>
  
  
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendCounselingSessionAcceptance=(request)=>{const mailOptions={from:process.env.email,to:request.email,subject:"Counseling Session Accepted",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Counseling Session Accepted</h2>
          <p>Dear User,</p>
          <p>We are pleased to inform you that your counseling session request has been accepted. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Nane:</strong> ${request.fullName}</li>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Date:</strong> ${request.date}</li>
          </ul>
          <p>You will receive another email before the session with session platform and link. Please complete the payment process before that.</p>
          <p>We look forward to seeing you then.</p>
          <br>
          <p>Best regards,</p>
          <p>Balanced Bites</p>
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendCounselingSessionRejection=(request)=>{const mailOptions={from:process.env.email,to:request.email,subject:"Counseling Session Request Rejected",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #FF0000;">Counseling Session Request Rejected</h2>
          <p>Dear User,</p>
          <p>We regret to inform you that your counseling session request has been rejected. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Nane:</strong> ${request.fullName}</li>
            <li><strong>Email:</strong> ${request.email}</li>
            <li><strong>Date:</strong> ${request.date}</li>
          </ul>
          <p>Please feel free to request another session at a different time.</p>
          <br>
          <p>Best regards,</p>
          <p>Balanced bites</p>
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendDietPlanRequest=(request,userData)=>{const mailOptions={from:userData.email,to:process.env.email,subject:"Diet Plan Request",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Diet Plan Request</h2>
          <p>You have received a request for a diet plan. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
            <li><strong>Email:</strong> ${userData.email}</li>
            <li><strong>Diet Type:</strong> ${request.dietType}</li>
          </ul>
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendDietPlanAcceptance=(request,userData)=>{const mailOptions={from:process.env.email,to:userData.email,subject:"Diet Plan Accepted",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Diet Plan Accepted</h2>
          <p>Dear ${userData.firstName} ${userData.lastName},</p>
          <p>We are pleased to inform you that your diet plan request has been accepted. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
            <li><strong>Email:</strong> ${userData.email}</li>
            <li><strong>Diet Type:</strong> ${request.dietType}</li>
          </ul>
          <p>You will receive your personalized diet plan soon. Please complete the payment process before that.</p>
          <p>We look forward to helping you achieve your goals.</p>
          <br>
          <p>Best regards,</p>
          <p>Balanced Bites</p>
        </div>
      `,};return transporter.sendMail(mailOptions)};const sendDietPlanRejection=(request,userData)=>{const mailOptions={from:process.env.email,to:userData.email,subject:"Diet Plan Request Rejected",html:`
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #FF0000;">Diet Plan Request Rejected</h2>
          <p>Dear ${userData.firstName} ${userData.lastName},</p>
          <p>We regret to inform you that your diet plan request has been rejected. Here are the details:</p>
          <ul style="background: #f2f2f2; padding: 10px; border-radius: 5px;">
            <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
            <li><strong>Email:</strong> ${userData.email}</li>
            <li><strong>Diet Type:</strong> ${request.dietType}</li>
          </ul>
          <p>Please feel free to request another diet plan at a different time.</p>
          <br>
          <p>Best regards,</p>
          <p>Balanced Bites</p>
        </div>
      `,};return transporter.sendMail(mailOptions)};function sendContactEmail(email,message){const htmlContent=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Us Email</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
                color: #333;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #fff;
                box-shadow: 0 4px 15px rgb(0 0 0 / 10%);
                border-radius: 10px;
                overflow: hidden;
            }
            .header {
                background-color: #4b6cb7;
                background: linear-gradient(to right, #4b6cb7, #182848);
                color: #fff;
                text-align: center;
                padding: 20px;
            }
            .header h1 {
                margin: 0;
            }
            .content {
                padding: 30px;
            }
            .content h2 {
                color: #3498db;
            }
            .content p {
                margin: 0 0 15px;
                line-height: 1.6;
            }
            .footer {
                background-color: #f4f4f4;
                text-align: center;
                padding: 20px;
                font-size: 14px;
                color: #aaa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Contact Us</h1>
            </div>
            <div class="content">
                <h2>Hello,</h2>
                <p>You have a new message from your website's contact form.</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            </div>
            <div class="footer">
                <p>Thank you for contacting us. We will get back to you shortly.</p>
            </div>
        </div>
    </body>
    </html>
    `;const mailOptions={from:email,to:process.env.email,subject:"New Contact Us Message",html:htmlContent,};return transporter.sendMail(mailOptions)}
  module.exports={sendOTP,sendCounselingSessionRequest,sendCounselingSessionAcceptance,sendCounselingSessionRejection,sendPaymentConfirmationEmail,sendDietPlanRequest,sendDietPlanAcceptance,sendDietPlanRejection,sendContactEmail,}