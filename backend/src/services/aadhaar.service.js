import ApiError from "../utils/errors/ApiError.js";

/**
 * Aadhaar number verification
 *
 * TODO:
 * Integrate Surepass Aadhaar verification API
 * once API credentials are available.
 */
export const verifyAadhaarNumber = async (
  aadhaarNumber
) => {
  if (!aadhaarNumber) {
    throw new ApiError(
      400,
      "Aadhaar number is required."
    );
  }

  // Surepass integration will be added here.
  throw new ApiError(
    501,
    "Aadhaar verification service is not configured yet."
  );
};


/**
 * Aadhaar document verification
 *
 * TODO:
 * Integrate Surepass Aadhaar document
 * verification API here.
 */
export const verifyAadhaarDocument = async ({
  documentUrl,
  aadhaarNumber,
}) => {
  if (!documentUrl) {
    throw new ApiError(
      400,
      "Aadhaar document is required."
    );
  }

  // Surepass integration will be added here.
  throw new ApiError(
    501,
    "Aadhaar document verification service is not configured yet."
  );
};