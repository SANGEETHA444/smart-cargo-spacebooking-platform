import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/cargoshare",
  jwtSecret: process.env.JWT_SECRET || "dev-jwt-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  razorpayEnabled: process.env.RAZORPAY_ENABLED === "true",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  nodeEnv: process.env.NODE_ENV || "development",
};
