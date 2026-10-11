import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const otpRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,

  limit: 3,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 2 minutes.",
  },

  keyGenerator: (req) => {
    return req.body?.phone || ipKeyGenerator(req.ip);
  },
});

export default otpRateLimiter;