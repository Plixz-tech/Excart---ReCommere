import https from "https";

const POWERAPI_BASE_URL =
  process.env.POWERAPI_BASE_URL ||
  "https://powerapi.in";

const POWERAPI_API_KEY =
  process.env.POWERAPI_API_KEY;


/*
 * =========================
 * COMMON POWERAPI REQUEST
 * =========================
 */

const powerApiRequest = async (
  endpoint,
  {
    method = "POST",
    body = undefined,
  } = {}
) => {
  if (!POWERAPI_API_KEY) {
    const error = new Error(
      "POWERAPI_API_KEY is not configured."
    );

    error.statusCode = 500;

    throw error;
  }

const url = new URL(
  `${POWERAPI_BASE_URL}${endpoint}`
);

if (method === "GET" && body) {
  if (body.ifsc) {
    url.searchParams.set("ifsc", body.ifsc);
  }

  if (body.account_number) {
    url.searchParams.set(
      "account_number",
      body.account_number
    );
  }
}

const requestBody =
  body !== undefined
    ? JSON.stringify(body)
    : undefined;

  const result =
    await new Promise(
      (resolve, reject) => {
        const request =
          https.request(
            url,
            {
              method,

              headers: {
                Authorization:
                  `Bearer ${POWERAPI_API_KEY}`,

                "Content-Type":
                  "application/json",

                ...(requestBody
                  ? {
                      "Content-Length":
                        Buffer.byteLength(
                          requestBody
                        ),
                    }
                  : {}),
              },
            },
            (response) => {
              let responseData = "";

              response.on(
                "data",
                (chunk) => {
                  responseData +=
                    chunk.toString();
                }
              );

              response.on(
                "end",
                () => {
                  let parsedData = {};

                  try {
                    parsedData =
                      responseData
                        ? JSON.parse(
                            responseData
                          )
                        : {};
                  } catch {
                    parsedData = {};
                  }

                  resolve({
                    statusCode:
                      response.statusCode ||
                      500,

                    data: parsedData,
                  });
                }
              );
            }
          );

        request.on(
          "error",
          (error) => {
            reject(error);
          }
        );

        if (requestBody) {
          request.write(requestBody);
        }

        request.end();
      }
    );

  const responseStatus =
    result.statusCode;

  const responseData =
    result.data;

  if (
    responseStatus < 200 ||
    responseStatus >= 300 ||
    responseData.success === false
  ) {
    const error = new Error(
      responseData.message ||
        "PowerAPI request failed."
    );

    error.statusCode =
      responseStatus;

    throw error;
  }

  return responseData;
};


/*
 * =========================
 * AADHAAR
 * =========================
 */


/*
 * Aadhaar - Send OTP
 */
export const sendAadhaarOtp = async (
  aadhaarNumber
) => {
  return powerApiRequest(
    "/api/v1/kyc/aadhaar/send-otp",
    {
      method: "POST",

      body: {
        aadhaar_number:
          aadhaarNumber,
      },
    }
  );
};


/*
 * Aadhaar - Verify OTP
 */
export const verifyAadhaarOtp = async (
  otp,
  referenceId
) => {
  return powerApiRequest(
    "/api/v1/kyc/aadhaar/verify-otp",
    {
      method: "POST",

      body: {
        otp,

        reference_id:
          referenceId,
      },
    }
  );
};


/*
 * =========================
 * PAN
 * =========================
 */


/*
 * PAN Verification
 */
export const verifyPan = async (
  panNumber
) => {
  return powerApiRequest(
    "/api/v1/kyc/pan/verify-pan",
    {
      method: "POST",

      body: {
        pan_number:
          panNumber,
      },
    }
  );
};


/*
 * =========================
 * BANK
 * =========================
 */


/*
 * Bank Account Verification
 *
 * Penny Less
 */
export const verifyBankAccount = async (
  accountNumber,
  ifsc
) => {
  const response =
    await powerApiRequest(
      "/api/v1/bank/bank-account-pennyless-details/penny-less",
      {
        method: "GET",

        body: {
          ifsc,

          account_number:
            accountNumber,
        },
      }
    );

  return {
    success: true,

    message:
      response?.data?.message ||
      "Bank account verification successful.",

    data:
      response?.data || {},
  };
};

/*
 * Bank Account Verification
 *
 * Penny Less
 */
export const verifyBankAccountPennyLess =
  async (
    accountNumber,
    ifsc
  ) => {
    const response =
      await powerApiRequest(
        "/api/v1/bank/bank-account-pennyless-details/penny-less",
        {
          method: "GET",

          body: {
            ifsc,

            account_number:
              accountNumber,
          },
        }
      );

    return {
      success: true,

      message:
        response?.data?.message ||
        "Bank account verification successful.",

      data:
        response?.data || {},
    };
  };


/*
/*
 * Get Bank Details By IFSC
 */
export const getBankDetailsByIfsc =
  async (
    ifsc
  ) => {
    return powerApiRequest(
      "/api/v1/bank/bank-details/branch-info",
      {
        method: "GET",

        body: {
          ifsc,
        },
      }
    );
  };