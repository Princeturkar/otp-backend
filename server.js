import express from "express";
import axios from "axios";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

// CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://expense-tracker-sepia-phi-13.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

// SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send OTP
app.post("/api/send-otp", async (req, res) => {

  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  try {

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "OTP Verification",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Your OTP Code</h2>
          <h1>${otpCode}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {

  console.log("MAIL ERROR:", error);

  return res.status(500).json({
    success: false,
    message: error.message
  });
}
  });

// Razorpay Order
app.post("/api/create-order", async (req, res) => {

  const { amount } = req.body;

  try {

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.razorpay.com/v1/orders",
      {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).json({
      success: true,
      order: response.data
    });

  } catch (error) {

    console.log(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
