import * as powerApiProvider
  from "./providers/powerapi.provider.js";


/*
 *
 * AADHAAR
 *
 */


/*
 * Send Aadhaar OTP
 */
export const sendAadhaarOtp = async (
  aadhaarNumber
) => {
  return powerApiProvider.sendAadhaarOtp(
    aadhaarNumber
  );
};


/*
 * Verify Aadhaar OTP
 */
export const verifyAadhaarOtp = async (
  otp,
  referenceId
) => {
  return powerApiProvider.verifyAadhaarOtp(
    otp,
    referenceId
  );
};


/*
 *
 * PAN
 *
 */


/*
 * Verify PAN number
 */
export const verifyPan = async (
  panNumber
) => {
  return powerApiProvider.verifyPan(
    panNumber
  );
};


/*
 *
 * BANK
 *
 */


/*
 * Bank account verification
 */
export const verifyBankAccount = async (
  accountNumber,
  ifsc
) => {
  return powerApiProvider.verifyBankAccount(
    accountNumber,
    ifsc
  );
};


/*
 * Bank account penny-less verification
 */
export const verifyBankAccountPennyLess =
  async (
    accountNumber,
    ifsc
  ) => {
    return powerApiProvider.verifyBankAccountPennyLess(
      accountNumber,
      ifsc
    );
  };


/*
 *
 * IFSC
 *
 */


/*
 * Get bank details using IFSC
 */
export const getBankDetailsByIfsc =
  async (
    ifsc
  ) => {
    return powerApiProvider.getBankDetailsByIfsc(
      ifsc
    );
  };