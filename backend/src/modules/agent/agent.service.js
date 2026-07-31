import * as agentRepository from "./agent.repository.js";

export const createAgent = async (agentData, adminId) => {
  return await agentRepository.createAgent(agentData, adminId);
};

export const getAgents = async (queryParams) => {
  return await agentRepository.getAgents(queryParams);
};

export const getAgentById = async (agentId) => {
  return await agentRepository.getAgentById(agentId);
};

export const updateAgent = async (agentId, agentData, adminId) => {
  return await agentRepository.updateAgent(
    agentId,
    agentData,
    adminId
  );
};

export const updateAgentStatus = async (agentId, status) => {
  return await agentRepository.updateAgentStatus(agentId, status);
};

export const deleteAgent = async (agentId) => {
  return await agentRepository.deleteAgent(agentId);
};

export const uploadDocuments = async (agentId, files, adminId) => {
  return await agentRepository.uploadDocuments(
    agentId,
    files,
    adminId
  );
};


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

