import { checkIMEI } from "./imei.provider.js";

export const verifyIMEI = async (imei) => {
  return await checkIMEI(imei);
};