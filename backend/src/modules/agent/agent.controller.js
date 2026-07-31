import * as agentService from "./agent.service.js";

export const createAgent = async (req, res, next) => {
  try {
    const result = await agentService.createAgent(
  req.body,
  req.user.userId
);

    res.status(201).json({
      success: true,
      message: "Agent created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAgents = async (req, res, next) => {
  try {
    const result = await agentService.getAgents(req.query);

    res.status(200).json({
      success: true,
      message: "Agents fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAgentById = async (req, res, next) => {
  try {
    const result = await agentService.getAgentById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Agent fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgent = async (req, res, next) => {
  try {
    const result = await agentService.updateAgent(
      req.params.id,
      req.body,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAgentStatus = async (req, res, next) => {
  try {
    const result = await agentService.updateAgentStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: "Agent status updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAgent = async (req, res, next) => {
  try {
    await agentService.deleteAgent(req.params.id);

    res.status(200).json({
      success: true,
      message: "Agent deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocuments = async (req, res, next) => {
  try {
    const result = await agentService.uploadDocuments(
      req.params.id,
      req.files,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const verifyAadhaar = async (req, res, next) => {
  try {
    console.log("req.user =", req.user);
    const result = await agentService.verifyAadhaar(
      req.params.id,
      req.body.aadhaarNumber,
      req.user.userId
    );

    res.status(200).json({
      success: true,
      message: "Aadhaar verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};




