import * as agentService from "./agent.service.js";


/*
 * CREATE AGENT
 */
export const createAgent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.createAgent(
        req.body,
        req.user.userId
      );

    res.status(201).json({
      success: true,
      message:
        "Agent created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * GET ALL AGENTS
 */
export const getAgents = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.getAgents(
        req.query
      );

    res.status(200).json({
      success: true,
      message:
        "Agents fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * GET AGENT BY ID
 */
export const getAgentById = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.getAgentById(
        req.params.id
      );

    res.status(200).json({
      success: true,
      message:
        "Agent fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * UPDATE AGENT
 */
export const updateAgent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.updateAgent(
        req.params.id,
        req.body,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Agent updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * UPDATE AGENT STATUS
 */
export const updateAgentStatus = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.updateAgentStatus(
        req.params.id,
        req.body.status
      );

    res.status(200).json({
      success: true,
      message:
        "Agent status updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * DELETE AGENT
 */
export const deleteAgent = async (
  req,
  res,
  next
) => {
  try {
    await agentService.deleteAgent(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Agent deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};


/*
 * UPLOAD AGENT DOCUMENTS
 */
export const uploadDocuments = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.uploadDocuments(
        req.params.id,
        req.files,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Documents uploaded successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * SEND AGENT AADHAAR OTP
 */
export const sendAgentAadhaarOtp = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.sendAgentAadhaarOtp(
        req.params.id,
        req.body.aadhaarNumber
      );

    res.status(200).json({
      success: true,
      message:
        "Aadhaar OTP sent successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * VERIFY AGENT AADHAAR OTP
 */
export const verifyAgentAadhaarOtp = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.verifyAgentAadhaarOtp(
        req.params.id,
        req.body.otp,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Aadhaar verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
 * VERIFY AGENT PAN
 */
export const verifyAgentPan = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await agentService.verifyAgentPan(
        req.params.id,
        req.body.panNumber,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "PAN verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};