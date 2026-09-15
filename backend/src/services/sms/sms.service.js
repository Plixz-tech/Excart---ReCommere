import { sendOtpSms } from "./providers/msg91.provider.js";

export const sendOtp = async ({ phone, otp }) => {
  return sendOtpSms({
    phone,
    otp,
  });
};