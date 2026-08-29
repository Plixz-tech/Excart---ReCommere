const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENVIRONMENT === "production"
    ? "https://api.cashfree.com/payout"
    : "https://sandbox.cashfree.com/payout";

const getCashfreeHeaders = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error(
      "Cashfree API credentials are not configured."
    );

    error.statusCode = 500;

    throw error;
  }

  return {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-client-secret": clientSecret,
    "x-api-version": "2024-01-01",
  };
};

export const cashfreeRequest = async (
  method,
  path,
  body = undefined
) => {
  const response = await fetch(
    `${CASHFREE_BASE_URL}${path}`,
    {
      method,
      headers: getCashfreeHeaders(),
      ...(body !== undefined
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    }
  );

  const responseText =
    await response.text();

  let data = {};

  try {
    data = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    data = {
      message: responseText,
    };
  }

  if (!response.ok) {
    const error = new Error(
      data?.message ||
        data?.error ||
        "Cashfree API request failed."
    );

    error.statusCode = response.status;
    error.cashfreeResponse = data;

    throw error;
  }

  return data;
};

export const getCashfreeBaseUrl = () =>
  CASHFREE_BASE_URL;