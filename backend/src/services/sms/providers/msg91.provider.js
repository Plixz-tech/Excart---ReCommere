import https from "https";

const MSG91_API_URL = "api.msg91.com";

export const sendOtpSms = ({ phone, otp }) => {
  return new Promise((resolve, reject) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID;

    if (!authKey) {
      return reject(new Error("MSG91_AUTH_KEY is not configured."));
    }

    if (!templateId) {
      return reject(
        new Error("MSG91_OTP_TEMPLATE_ID is not configured.")
      );
    }

    if (!senderId) {
      return reject(
        new Error("MSG91_SENDER_ID is not configured.")
      );
    }

    const requestBody = JSON.stringify({
      template_id: templateId,
      mobile: `91${phone}`,
      otp: otp,
    });

    const options = {
      hostname: MSG91_API_URL,
      path: "/api/v5/otp",
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        let parsedData;

        try {
          parsedData = JSON.parse(data);
        } catch {
          parsedData = data;
        }

        if (response.statusCode >= 200 && response.statusCode < 300) {
          return resolve(parsedData);
        }

        const error = new Error(
          parsedData?.message || "MSG91 failed to send OTP."
        );

        error.statusCode = response.statusCode;
        error.response = parsedData;

        reject(error);
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(requestBody);
    request.end();
  });
};