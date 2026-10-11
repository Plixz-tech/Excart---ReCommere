import { rateLimit } from "express-rate-limit";

const socialLoginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 5 minutes.",
  },
});

export default socialLoginRateLimiter;