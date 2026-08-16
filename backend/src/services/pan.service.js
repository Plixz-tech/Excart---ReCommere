import ApiError from "../utils/errors/ApiError.js";

/**
 * PAN document verification
 *
 * TODO:
 * Integrate Surepass PAN document verification API
 * once API credentials are available.
 */
export const verifyPanDocument = async ({
  documentUrl,
}) => {
  if (!documentUrl) {
    throw new ApiError(
      400,
      "PAN document is required."
    );
  }

  // Surepass PAN document verification
  // will be integrated here later.

  throw new ApiError(
    501,
    "PAN document verification service is not configured yet."
  );
};