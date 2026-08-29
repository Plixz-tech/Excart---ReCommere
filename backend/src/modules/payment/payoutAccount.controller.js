import ApiError from "../../utils/errors/ApiError.js";

import {
    createPayoutAccount,
    verifyPayoutAccount,
    registerCashfreeBeneficiary,
} from "./payoutAccount.service.js";



// CREATE PAYOUT ACCOUNT


export const createPayoutAccountController = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user?.userId?.toString();

    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const {
      type,
      accountHolderName,
      bankAccountNumber,
      bankIfsc,
      upiId,
      phone,
      email,
      address,
      city,
      state,
      postalCode,
    } = req.body;

    const payoutAccount =
      await createPayoutAccount(
        userId,
        {
          type,
          accountHolderName,
          bankAccountNumber,
          bankIfsc,
          upiId,
          phone,
          email,
          address,
          city,
          state,
          postalCode,
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Payout account created successfully.",
      data: payoutAccount,
    });

  } catch (error) {
    next(error);
  }
};


// VERIFY PAYOUT ACCOUNT


export const verifyPayoutAccountController =
    async (req, res, next) => {
        try {
            const payoutAccountId =
                req.params.payoutAccountId;

            const userId =
                req.user?.userId?.toString();

            if (!userId) {
                throw new ApiError(
                    401,
                    "Authentication required."
                );
            }

            const result =
                await verifyPayoutAccount(
                    payoutAccountId,
                    userId
                );

            return res.status(200).json({
                success: true,
                message:
                    "Payout account verified successfully.",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };



// REGISTER CASHFREE BENEFICIARY


export const registerCashfreeBeneficiaryController =
  async (req, res, next) => {
    try {
      const {
        payoutAccountId,
      } = req.params;

      const userId =
        req.user?.userId?.toString();

      if (!userId) {
        throw new ApiError(
          401,
          "Authentication required."
        );
      }

      const result =
        await registerCashfreeBeneficiary({
          payoutAccountId,
          userId,
        });

      return res.status(200).json({
        success: true,
        message:
          "Cashfree beneficiary registered successfully.",
        data: result,
      });

    } catch (error) {
      next(error);
    }
  };