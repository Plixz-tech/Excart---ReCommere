import { cashfreeRequest } from "./cashfree.js";

// CREATE CASHFREE BENEFICIARY

export const createBeneficiary = async ({
  beneficiaryId,
  beneficiaryName,
  bankAccountNumber,
  bankIfsc,
  vpa,
  email,
  phone,
  address,
  city,
  state,
  postalCode,
}) => {
  const body = {
    beneficiary_id: beneficiaryId,

    beneficiary_name: beneficiaryName,

    beneficiary_instrument_details: {
      ...(bankAccountNumber
        ? {
            bank_account_number:
              bankAccountNumber,
          }
        : {}),

      ...(bankIfsc
        ? {
            bank_ifsc: bankIfsc,
          }
        : {}),

      ...(vpa
        ? {
            vpa,
          }
        : {}),
    },

    beneficiary_contact_details: {
      ...(email
        ? {
            beneficiary_email: email,
          }
        : {}),

      ...(phone
        ? {
            beneficiary_phone: phone,
          }
        : {}),

      beneficiary_country_code: "+91",

      ...(address
        ? {
            beneficiary_address: address,
          }
        : {}),

      ...(city
        ? {
            beneficiary_city: city,
          }
        : {}),

      ...(state
        ? {
            beneficiary_state: state,
          }
        : {}),

      ...(postalCode
        ? {
            beneficiary_postal_code:
              postalCode,
          }
        : {}),
    },
  };

  return cashfreeRequest(
    "POST",
    "/beneficiary",
    body
  );
};


// CREATE CASHFREE TRANSFER

export const createTransfer = async ({
  transferId,
  amount,
  beneficiaryId,
  transferMode = "banktransfer",
  remarks = "",
}) => {
  const body = {
    transfer_id: transferId,

    transfer_amount: Number(amount),

    beneficiary_details: {
      beneficiary_id: beneficiaryId,
    },

    transfer_currency: "INR",

    transfer_mode: transferMode,

    ...(remarks
      ? {
          transfer_remarks: remarks,
        }
      : {}),
  };

  return cashfreeRequest(
    "POST",
    "/transfers",
    body
  );
};


// GET TRANSFER STATUS

export const getTransferStatus = async ({
  transferId,
  cfTransferId,
}) => {
  const params =
    new URLSearchParams();

  if (transferId) {
    params.set(
      "transfer_id",
      transferId
    );
  }

  if (cfTransferId) {
    params.set(
      "cf_transfer_id",
      cfTransferId
    );
  }

  if (!params.toString()) {
    const error = new Error(
      "Transfer ID or Cashfree transfer ID is required."
    );

    error.statusCode = 400;

    throw error;
  }

  return cashfreeRequest(
    "GET",
    `/transfers?${params.toString()}`
  );
};