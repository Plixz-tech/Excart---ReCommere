import mongoose from "mongoose";

import ApiError from "../../utils/errors/ApiError.js";

import * as payoutAccountRepository from "./payoutAccount.repository.js";

import * as verificationService from "../../services/verification/verification.service.js";

import {createBeneficiary,} from "../../lib/cashfreePayout.js";

// GET PAYOUT ACCOUNT


export const getPayoutAccount = async (
  userId
) => {
  const account =
    await payoutAccountRepository.findByUserId(
      userId
    );

  if (!account) {
    throw new ApiError(
      404,
      "Payout account not found."
    );
  }

  return account;
};



// CREATE PAYOUT ACCOUNT


export const createPayoutAccount = async (
  userId,
  data
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid user ID."
    );
  }

  const existing =
    await payoutAccountRepository.findByUserId(
      userId
    );

  if (existing) {
    throw new ApiError(
      409,
      "Payout account already exists."
    );
  }

  if (!data.type) {
    throw new ApiError(
      400,
      "Payout account type is required."
    );
  }

  if (
    !["bank", "upi"].includes(
      data.type
    )
  ) {
    throw new ApiError(
      400,
      "Invalid payout account type."
    );
  }

  if (data.type === "bank") {
    if (
      !data.bankAccountNumber ||
      !data.bankIfsc
    ) {
      throw new ApiError(
        400,
        "Bank account number and IFSC are required."
      );
    }
  }

  if (
    data.type === "upi" &&
    !data.upiId
  ) {
    throw new ApiError(
      400,
      "UPI ID is required."
    );
  }

  const account =
    await payoutAccountRepository.create({
      user: userId,

      type: data.type,

      accountHolderName:
        data.accountHolderName || "",

      bankAccountNumber:
        data.bankAccountNumber || "",

      bankIfsc:
        data.bankIfsc || "",

      upiId:
        data.upiId || "",

      phone:
        data.phone || "",

      email:
        data.email || "",

      isVerified: false,

      cashfreeBeneficiaryId:
        "",

      cashfreeBeneficiaryStatus:
        "not_created",

      status: "active",

      createdBy: userId,

      updatedBy: userId,
    });

  return account;
};


// VERIFY PAYOUT ACCOUNT

export const verifyPayoutAccount = async (
  payoutAccountId,
  userId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      payoutAccountId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid payout account ID."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid user ID."
    );
  }

  const payoutAccount =
    await payoutAccountRepository.findById(
      payoutAccountId
    );

  if (!payoutAccount) {
    throw new ApiError(
      404,
      "Payout account not found."
    );
  }

  // Make sure the payout account belongs
  // to the authenticated user.
  if (
    payoutAccount.user.toString() !==
    userId.toString()
  ) {
    throw new ApiError(
      403,
      "You are not allowed to verify this payout account."
    );
  }

  // Already verified
  if (payoutAccount.isVerified) {
    return payoutAccount;
  }

  // PowerAPI bank verification is currently
  // implemented for bank accounts.
  if (payoutAccount.type !== "bank") {
    throw new ApiError(
      400,
      "Only bank accounts can be verified."
    );
  }

  // Check required bank details
  if (
    !payoutAccount.bankAccountNumber ||
    !payoutAccount.bankIfsc
  ) {
    throw new ApiError(
      400,
      "Bank account number and IFSC are required."
    );
  }

  // Call PowerAPI
  const verificationResult =
    await verificationService.verifyBankAccount(
      payoutAccount.bankAccountNumber,
      payoutAccount.bankIfsc
    );

  // PowerAPI request failed
  if (!verificationResult?.success) {
    throw new ApiError(
      400,
      verificationResult?.message ||
        "Bank account verification failed."
    );
  }

  const bankData =
    verificationResult?.data || {};

  /*
   * Only mark the account as verified when
   * PowerAPI explicitly confirms the account exists.
   */
  if (bankData.account_exists !== true) {
    throw new ApiError(
      400,
      "Bank account could not be verified."
    );
  }

  const verifiedAt = new Date();

  // Save successful verification
  const verifiedAccount =
    await payoutAccountRepository.updateById(
      payoutAccountId,
      {
        isVerified: true,

        verifiedAt,

        updatedBy: userId,

        bankVerification: {
          provider: "powerapi",

          accountExists:
            bankData.account_exists,

          nameAtBank:
            bankData.name_at_bank || "",

          utr:
            bankData.utr || "",

          verifiedAt,
        },
      }
    );

  return verifiedAccount;
};
// UPDATE PAYOUT ACCOUNT


export const updatePayoutAccount = async (
  userId,
  data
) => {
  const account =
    await payoutAccountRepository.findByUserId(
      userId
    );

  if (!account) {
    throw new ApiError(
      404,
      "Payout account not found."
    );
  }

  const updateData = {
    updatedBy: userId,
  };

  if (
    data.accountHolderName !==
    undefined
  ) {
    updateData.accountHolderName =
      data.accountHolderName;
  }

  if (
    data.bankAccountNumber !==
    undefined
  ) {
    updateData.bankAccountNumber =
      data.bankAccountNumber;
  }

  if (
    data.bankIfsc !==
    undefined
  ) {
    updateData.bankIfsc =
      data.bankIfsc;
  }

  if (
    data.upiId !==
    undefined
  ) {
    updateData.upiId =
      data.upiId;
  }

  if (
    data.phone !==
    undefined
  ) {
    updateData.phone =
      data.phone;
  }

  if (
    data.email !==
    undefined
  ) {
    updateData.email =
      data.email;
  }

  // If payout details change,
  // previous verification and Cashfree
  // beneficiary registration are invalid.

  if (
    data.bankAccountNumber !==
      undefined ||
    data.bankIfsc !==
      undefined ||
    data.upiId !==
      undefined
  ) {
    updateData.isVerified =
      false;

    updateData.verifiedAt =
      null;

    updateData.cashfreeBeneficiaryId =
      "";

    updateData.cashfreeBeneficiaryStatus =
      "not_created";
  }

  return payoutAccountRepository.updateByUserId(
    userId,
    updateData
  );
};



// REGISTER CASHFREE BENEFICIARY


export const registerCashfreeBeneficiary =
  async ({
    payoutAccountId,
    userId,
  }) => {

    if (
      !mongoose.Types.ObjectId.isValid(
        payoutAccountId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid payout account ID."
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid user ID."
      );
    }

    const payoutAccount =
      await payoutAccountRepository.findById(
        payoutAccountId
      );

    if (!payoutAccount) {
      throw new ApiError(
        404,
        "Payout account not found."
      );
    }

    if (
      payoutAccount.user.toString() !==
      userId.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to access this payout account."
      );
    }

    if (
      !payoutAccount.isVerified
    ) {
      throw new ApiError(
        400,
        "Payout account must be verified before registering with Cashfree."
      );
    }

    if (
      payoutAccount
        .cashfreeBeneficiaryStatus ===
      "created"
    ) {
      return payoutAccount;
    }

    const beneficiaryId =
      `user_${payoutAccount.user.toString()}`;

    const cashfreeResponse =
      await createBeneficiary({
        beneficiaryId,

        beneficiaryName:
          payoutAccount.accountHolderName,

        bankAccountNumber:
          payoutAccount.bankAccountNumber,

        bankIfsc:
          payoutAccount.bankIfsc,

        vpa:
          payoutAccount.upiId,

        email:
          payoutAccount.email,

        phone:
          payoutAccount.phone,
      });

    const updatedAccount =
      await payoutAccountRepository.updateById(
        payoutAccountId,
        {
          cashfreeBeneficiaryId:
            beneficiaryId,

          cashfreeBeneficiaryStatus:
            "created",
        }
      );

    return {
      payoutAccount:
        updatedAccount,

      cashfreeResponse,
    };
  };