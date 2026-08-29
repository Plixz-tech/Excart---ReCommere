import PayoutAccount from "../../models/PayoutAccount.js";

// GET ACTIVE PAYOUT ACCOUNT BY USER

export const getByUserId = async (userId) => {
  return PayoutAccount.findOne({
    user: userId,
    status: "active",
  }).select("+bankAccountNumber");
};


// GET PAYOUT ACCOUNT BY USER

export const findByUserId = async (userId) => {
  return PayoutAccount.findOne({
    user: userId,
  }).select("+bankAccountNumber");
};


// GET PAYOUT ACCOUNT BY ID

export const findById = async (payoutAccountId) => {
  return PayoutAccount.findById(
    payoutAccountId
  ).select("+bankAccountNumber");
};


// CREATE PAYOUT ACCOUNT

export const create = async (data) => {
  return PayoutAccount.create(data)
};


// UPDATE PAYOUT ACCOUNT BY USER

export const updateByUserId = async (
  userId,
  data
) => {
  return PayoutAccount.findOneAndUpdate(
    {
      user: userId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  ).select("+bankAccountNumber");
};


// UPDATE PAYOUT ACCOUNT BY ID

export const updateById = async (
  payoutAccountId,
  data
) => {
  return PayoutAccount.findByIdAndUpdate(
    payoutAccountId,
    data,
    {
      new: true,
      runValidators: true,
    }
  ).select("+bankAccountNumber");
};


// UPDATE BY CASHFREE BENEFICIARY ID

export const updateByBeneficiaryId = async (
  cashfreeBeneficiaryId,
  data
) => {
  return PayoutAccount.findOneAndUpdate(
    {
      cashfreeBeneficiaryId,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};