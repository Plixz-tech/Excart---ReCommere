import * as agentRepository
  from "./agent.repository.js";

import * as verificationService
  from "../../services/verification/verification.service.js";

import ApiError
  from "../../utils/errors/ApiError.js";


/*
 * CREATE AGENT
 */
export const createAgent = async (
  agentData,
  adminId
) => {
  return await agentRepository.createAgent(
    agentData,
    adminId
  );
};


/*
 * GET AGENTS
 */
export const getAgents = async (
  queryParams
) => {
  return await agentRepository.getAgents(
    queryParams
  );
};


/*
 * GET AGENT BY ID
 */
export const getAgentById = async (
  agentId
) => {
  return await agentRepository.getAgentById(
    agentId
  );
};


/*
 * UPDATE AGENT
 */
export const updateAgent = async (
  agentId,
  agentData,
  adminId
) => {
  return await agentRepository.updateAgent(
    agentId,
    agentData,
    adminId
  );
};


/*
 * UPDATE AGENT STATUS
 */
export const updateAgentStatus = async (
  agentId,
  status
) => {
  return await agentRepository.updateAgentStatus(
    agentId,
    status
  );
};


/*
 * DELETE AGENT
 */
export const deleteAgent = async (
  agentId
) => {
  return await agentRepository.deleteAgent(
    agentId
  );
};


/*
 * UPLOAD AGENT DOCUMENTS
 */
export const uploadDocuments = async (
  agentId,
  files,
  adminId
) => {
  return await agentRepository.uploadDocuments(
    agentId,
    files,
    adminId
  );
};


/*
 * OLD AADHAAR VERIFICATION
 *
 * Kept for compatibility with
 * your existing code.
 */
export const verifyAadhaar = (
  agentId,
  aadhaarNumber,
  adminId
) => {
  return agentRepository.verifyAadhaar(
    agentId,
    aadhaarNumber,
    adminId
  );
};


/*
 * SEND AGENT AADHAAR OTP
 *
 * Flow:
 *
 * Admin enters Aadhaar number
 *          ↓
 * PowerAPI Send OTP
 *          ↓
 * referenceId returned
 *          ↓
 * Save referenceId
 */
export const sendAgentAadhaarOtp = async (
  agentId,
  aadhaarNumber
) => {

  const agent =
    await agentRepository.getAgentById(
      agentId
    );

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  if (agent.status === "deleted") {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  const result =
    await verificationService.sendAadhaarOtp(
      aadhaarNumber
    );

  const referenceId =
    result?.data?.reference_id;

  if (!referenceId) {
    throw new ApiError(
      502,
      "PowerAPI did not return a reference ID."
    );
  }

  await agentRepository.saveAadhaarOtpReference(
    agentId,
    referenceId
  );

  return {
    referenceId,
    message:
      "Aadhaar OTP sent successfully.",
  };
};


/*
 * VERIFY AGENT AADHAAR OTP
 *
 * Flow:
 *
 * OTP
 *  ↓
 * PowerAPI
 *  ↓
 * Aadhaar verified
 *  ↓
 * Save Aadhaar number
 *  ↓
 * aadhaarNumberVerified = true
 */
export const verifyAgentAadhaarOtp =
  async (
    agentId,
    otp,
    adminId
  ) => {

    const agent =
      await agentRepository.getAgentById(
        agentId
      );

    if (!agent) {
      throw new ApiError(
        404,
        "Agent not found."
      );
    }

    const referenceId =
      agent.agentProfile
        ?.aadhaarVerification
        ?.referenceId;

    if (!referenceId) {
      throw new ApiError(
        400,
        "Please request Aadhaar OTP first."
      );
    }

    const result =
      await verificationService.verifyAadhaarOtp(
        otp,
        referenceId
      );

    if (!result?.success) {
      throw new ApiError(
        400,
        "Aadhaar verification failed."
      );
    }

    const aadhaarData =
      result?.data || {};

    const aadhaarNumber =
      aadhaarData.aadhaar_number ||
      agent.agentProfile?.aadhaarNumber;

    if (!aadhaarNumber) {
      throw new ApiError(
        502,
        "PowerAPI did not return the Aadhaar number."
      );
    }

    return agentRepository.verifyAgentAadhaar(
      agentId,
      aadhaarNumber,
      aadhaarData,
      adminId
    );
  };


/*
 * VERIFY AGENT PAN
 *
 * Flow:
 *
 * Admin enters PAN
 *        ↓
 * PowerAPI PAN verification
 *        ↓
 * Success
 *        ↓
 * Save PAN number
 *        ↓
 * panNumberVerified = true
 */
export const verifyAgentPan = async (
  agentId,
  panNumber,
  adminId
) => {

  const agent =
    await agentRepository.getAgentById(
      agentId
    );

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  const result =
    await verificationService.verifyPan(
      panNumber
    );

  if (!result?.success) {
    throw new ApiError(
      400,
      "PAN verification failed."
    );
  }

  return agentRepository.verifyAgentPan(
    agentId,
    panNumber,
    result?.data || {},
    adminId
  );
};

