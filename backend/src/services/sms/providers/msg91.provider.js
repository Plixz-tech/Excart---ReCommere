import https from "https";

const MSG91_API_HOST = "control.msg91.com";
const MSG91_OTP_PATH = "/api/v5/otp";

export const sendOtpSms = ({ phone, otp }) => {
  return new Promise((resolve, reject) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

    if (!authKey) {
      return reject(
        new Error("MSG91_AUTH_KEY is not configured.")
      );
    }

    if (!templateId) {
      return reject(
        new Error("MSG91_OTP_TEMPLATE_ID is not configured.")
      );
    }

    if (!phone) {
      return reject(
        new Error("Phone number is required.")
      );
    }

    if (!otp) {
      return reject(
        new Error("OTP is required.")
      );
    }

    const normalizedPhone = String(phone)
      .replace(/\D/g, "")
      .replace(/^91/, "");

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return reject(
        new Error("Invalid Indian phone number.")
      );
    }

    const requestBody = JSON.stringify({
      template_id: templateId,
      mobile: `91${normalizedPhone}`,
      otp: String(otp),
    });

    const options = {
      hostname: MSG91_API_HOST,
      path: MSG91_OTP_PATH,
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const request = https.request(
      options,
      (response) => {
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

          if (
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            return resolve(parsedData);
          }

          const error = new Error(
            parsedData?.message ||
              parsedData?.error ||
              "MSG91 failed to send OTP."
          );

          error.statusCode =
            response.statusCode;

          error.response = parsedData;

          reject(error);
        });
      }
    );

    request.on("error", (error) => {
      reject(error);
    });

    request.setTimeout(10000, () => {
      request.destroy(
        new Error(
          "MSG91 request timed out."
        )
      );
    });

    request.write(requestBody);
    request.end();
  });
};