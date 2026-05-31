import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

/* =========================
   CORS
========================= */

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://expense-tracker-sepia-phi-13.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

/* =========================
   SEND OTP
========================= */

app.post("/api/send-otp", async (req, res) => {

  const { email, otpCode } = req.body;

  if (!email || !otpCode) {

    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  try {

    console.log("OTP CODE:", otpCode);

    const response = await axios.post(

      "https://api.brevo.com/v3/smtp/email",

      {
        sender: {
          name: "Expense Tracker",
          email: process.env.SMTP_USER
        },

        to: [
          {
            email: email
          }
        ],

        subject: "OTP Verification",

        htmlContent: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Your OTP Code</h2>
            <h1>${otpCode}</h1>
            <p>This OTP is valid for 5 minutes.</p>
          </div>
        `
      },

      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("EMAIL SENT SUCCESSFULLY");
    console.log("BREVO RESPONSE:", response.data);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {

    console.log(
      "MAIL ERROR:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
});

/* =========================
   RAZORPAY ORDER
========================= */

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

    console.log(
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );
});
