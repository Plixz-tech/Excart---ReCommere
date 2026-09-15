import axios from "axios";
import { env } from "../../config/env/index.js";

const IMEI_API_URL = "https://dash.imei.info/api/check/0/";

export const checkIMEI = async (imei) => {
  const response = await axios.get(IMEI_API_URL, {
    params: {
      API_KEY: env.IMEI_API_KEY,
      imei,
    },
  });

  return response.data;
};