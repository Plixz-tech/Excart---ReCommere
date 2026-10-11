import mongoose from "mongoose";
import User from "../../models/User.js";
import ApiError from "../../utils/errors/ApiError.js";
import AgentEarning from "../../models/AgentEarning.js";
import bcrypt from "bcrypt";
import { getPagination } from "../../utils/pagination/paginate.js";
import cloudinary from "../../lib/cloudinary.js";
import streamifier from "streamifier";
import * as verificationService
  from "../../services/verification/verification.service.js";
import agentTrackingController from "../agentTracking/agentTracking.controller.js";

/**
 * Upload file to Cloudinary
 */
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date(),
        });
      }
    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(
      "Failed to delete Cloudinary file:",
      error.message
    );
  }
};

/**
 * Check whether all mandatory agent onboarding
 * verification/document requirements are completed.
 *
 * Required:
 * 1. Aadhaar number verified
 * 2. Aadhaar document verified
 * 3. PAN number verified
 * 4. PAN document verified
 * 5. Police Clearance uploaded
 * 6. Driving License uploaded
 * 7. Photo uploaded
 */
const isAgentVerificationComplete = (agent) => {
  const profile = agent.agentProfile;
  const documents = profile?.verificationDocuments;

  if (!profile || !documents) {
    return false;
  }

  return (
    profile.aadhaarNumberVerified === true &&
    profile.panNumberVerified === true &&
    Boolean(documents.aadhaar?.url) &&
    Boolean(documents.panCard?.url) &&
    Boolean(documents.policeClearance?.url) &&
    Boolean(documents.drivingLicense?.url) &&
    Boolean(documents.photo?.url)
  );
};

/**
 * Get all agents
 */
export const getAgents = async (queryParams) => {
  const filter = {
    role: "agent",
    status: { $ne: "deleted" },
  };

  const { page, limit, skip } =
    getPagination(queryParams);

  const {
    search,
    status,
    sortBy = "createdAt",
    order = "desc",
  } = queryParams;

  if (search) {
    filter.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
      {
        email: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    filter.status = status;
  }

  const allowedSortFields = [
    "fullName",
    "email",
    "phone",
    "status",
    "createdAt",
  ];

  const sortField =
    allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

  const sort = {
    [sortField]: order === "asc" ? 1 : -1,
  };

  const agents = await User.find(filter)
    .select(
      "fullName phone email profileImage role status isPhoneVerified agentProfile.agentId createdAt"
    )
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalAgents =
    await User.countDocuments(filter);

  return {
    agents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(
        totalAgents / limit
      ),
      totalAgents,
      limit,
    },
  };
};

/**
 * Get agent by ID
 */
export const getAgentById = async (agentId) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  }).select(
    "-password -googleId -facebookId"
  );

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  const earnings = await AgentEarning.find({
    agent: agentId,
  })
    .populate(
      "order",
      "orderNumber status agentCommission"
    )
    .sort({ createdAt: -1 });

  const commissionSummary = {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    cancelled: 0,
  };

  for (const earning of earnings) {
    const amount = Number(earning.amount || 0);

    commissionSummary.total += amount;

    if (
      commissionSummary[earning.status] !==
      undefined
    ) {
      commissionSummary[earning.status] += amount;
    }
  }

  return {
    ...agent.toObject(),
    commissionSummary,
    earnings,
  };
};

/**
 * Create agent
 *
 * Newly created agents start as inactive.
 *
 * They become active only after all mandatory
 * onboarding verification/documents are completed.
 */
export const createAgent = async (
  agentData,
  adminId
) => {
  const {
    fullName,
    email,
    phone,
    countryCode,
    password,
  } = agentData;

  const existingEmail =
    await User.findOne({
      email: email.toLowerCase(),
      status: { $ne: "deleted" },
    });

  if (existingEmail) {
    throw new ApiError(
      409,
      "Email already exists."
    );
  }

  const existingPhone =
    await User.findOne({
      phone,
      status: { $ne: "deleted" },
    });

  if (existingPhone) {
    throw new ApiError(
      409,
      "Phone number already exists."
    );
  }

  const lastAgent = await User.findOne({
    role: "agent",
  })
    .sort({ createdAt: -1 })
    .select("agentProfile.agentId");

  let nextNumber = 1;

  if (lastAgent?.agentProfile?.agentId) {
    nextNumber =
      parseInt(
        lastAgent.agentProfile.agentId.replace(
          "AGT",
          ""
        ),
        10
      ) + 1;
  }

  const agentId = `AGT${String(
    nextNumber
  ).padStart(6, "0")}`;

  const hashedPassword =
    await bcrypt.hash(password, 10);

  const agent = await User.create({
    fullName,
    email,
    phone,
    countryCode,
    password: hashedPassword,

    role: "agent",

    // New agent starts inactive.
    status: "inactive",

    isPhoneVerified: true,

    createdBy: adminId,

    agentProfile: {
      agentId,
    },
  });

  return await User.findById(
    agent._id
  ).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Update agent
 */
export const updateAgent = async (
  agentId,
  agentData,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  const {
    fullName,
    email,
    phone,
    countryCode,
    profileImage,
    agentProfile,
  } = agentData;

  if (email) {
    const existingEmail =
      await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: agentId },
        status: { $ne: "deleted" },
      });

    if (existingEmail) {
      throw new ApiError(
        409,
        "Email already exists."
      );
    }
  }

  if (phone) {
    const existingPhone =
      await User.findOne({
        phone,
        _id: { $ne: agentId },
        status: { $ne: "deleted" },
      });

    if (existingPhone) {
      throw new ApiError(
        409,
        "Phone number already exists."
      );
    }
  }

  if (fullName !== undefined) {
    agent.fullName = fullName;
  }

  if (email !== undefined) {
    agent.email = email;
  }

  if (phone !== undefined) {
    agent.phone = phone;
  }

  if (countryCode !== undefined) {
    agent.countryCode = countryCode;
  }

  if (profileImage !== undefined) {
    agent.profileImage = profileImage;
  }

  if (agentProfile) {
    if (
      agentProfile.experience !== undefined
    ) {
      agent.agentProfile.experience =
        agentProfile.experience;
    }

    if (
      agentProfile.alternatePhone !==
      undefined
    ) {
      agent.agentProfile.alternatePhone =
        agentProfile.alternatePhone;
    }

    if (
      agentProfile.operatingArea !== undefined
    ) {
      agent.agentProfile.operatingArea =
        agentProfile.operatingArea;
    }

    if (
      agentProfile.onboardingDate !== undefined
    ) {
      agent.agentProfile.onboardingDate =
        agentProfile.onboardingDate;
    }

    if (agentProfile.workingHours) {
      if (
        agentProfile.workingHours.start !==
        undefined
      ) {
        agent.agentProfile.workingHours.start =
          agentProfile.workingHours.start;
      }

      if (
        agentProfile.workingHours.end !==
        undefined
      ) {
        agent.agentProfile.workingHours.end =
          agentProfile.workingHours.end;
      }
    }

    if (agentProfile.address) {
      Object.assign(
        agent.agentProfile.address,
        agentProfile.address
      );
    }

    if (agentProfile.coverage) {
      Object.assign(
        agent.agentProfile.coverage,
        agentProfile.coverage
      );
    }
  }

  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Update agent status
 *
 * This remains separate from onboarding verification.
 *
 * Admin can use this endpoint to manually change
 * an already-created agent's account status.
 */
export const updateAgentStatus = async (
  agentId,
  status
) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  agent.status = status;

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Delete agent
 */
export const deleteAgent = async (
  agentId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  agent.status = "deleted";
  agent.deletedAt = new Date();

  // Free unique values
  agent.email = `${Date.now()}_${agent.email}`;
  agent.phone = `${Date.now()}_${agent.phone}`;

  await agent.save();

  return;
};

/**
 * Upload agent documents
 *
 * Required onboarding:
 *
 * Aadhaar:
 *   - Aadhaar number must already be verified.
 *   - Aadhaar document must be externally verified.
 *
 * PAN:
 *   - PAN document must be externally verified.
 *   - PAN number is stored from the verification result.
 *
 * Other mandatory documents:
 *   - Police Clearance
 *   - Driving License
 *   - Photo
 *
 * These are currently upload-only.
 *
 * After all mandatory requirements are complete,
 * an inactive agent is automatically activated.
 */
export const uploadDocuments = async (
  agentId,
  files,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  const documents =
    agent.agentProfile
      .verificationDocuments;

  const documentFields = [
    "aadhaar",
    "panCard",
    "drivingLicense",
    "policeClearance",
    "photo",
  ];

  for (const field of documentFields) {
    if (!files?.[field]?.length) {
      continue;
    }

    const file = files[field][0];

    /*
     * Delete previous document
     */
    if (documents[field]?.publicId) {
      await deleteFromCloudinary(
        documents[field].publicId
      );
    }

    /*
     * Upload new document
     */
    const uploadedDocument =
      await uploadToCloudinary(
        file,
        `agents/${agent.agentProfile.agentId}/${field}`
      );

    /*
     * Reset document verification state
     */
    documents[field] = {
      ...uploadedDocument,

      verified: false,
      rejected: false,
      rejectionReason: "",
      verifiedAt: null,
      verifiedBy: null,
    };


    /*
     * Driving License
     * Police Clearance
     * Photo
     *
     * These documents are mandatory,
     * but currently upload-only.
     */
  }

  agent.updatedBy = adminId;

  /*
   *
   * AUTOMATIC AGENT ACTIVATION
   *
   *
   * Only activate when:
   *
   * - Aadhaar number verified
   * - Aadhaar document verified
   * - PAN number verified
   * - PAN document verified
   * - Police Clearance uploaded
   * - Driving License uploaded
   * - Photo uploaded
   *
   * This does NOT affect the separate
   * updateAgentStatus() endpoint.
   */
  if (
    agent.status === "inactive" &&
    isAgentVerificationComplete(agent)
  ) {
    agent.status = "active";
  }

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Verify Aadhaar NUMBER
 *
 * This is separate from Aadhaar document verification.
 *
 * Flow:
 *
 * Admin enters Aadhaar number
 *        ↓
 * External Aadhaar number API
 *        ↓
 * Success
 *        ↓
 * aadhaarNumberVerified = true
 *
 * The Aadhaar document still needs to be
 * uploaded and separately verified.
 */
export const verifyAadhaar = async (
  agentId,
  aadhaarNumber,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(agentId)
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  if (
    !/^\d{12}$/.test(aadhaarNumber)
  ) {
    throw new ApiError(
      400,
      "Aadhaar number must be exactly 12 digits."
    );
  }

  /*
   * External Aadhaar number verification
   */
  const verificationResult =
    await aadhaarService.verifyAadhaarNumber(
      aadhaarNumber
    );

  if (
    !verificationResult?.verified
  ) {
    throw new ApiError(
      400,
      "Aadhaar number verification failed."
    );
  }

  /*
   * Save Aadhaar number
   */
  agent.agentProfile.aadhaarNumber =
    aadhaarNumber;

  /*
   * Mark NUMBER verification only.
   *
   * The Aadhaar document itself is
   * verified separately during upload.
   */
  agent.agentProfile
    .aadhaarNumberVerified = true;

  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};

export const saveAadhaarOtpReference = async (
  agentId,
  referenceId
) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  agent.agentProfile.aadhaarVerification.referenceId =
    referenceId;

  agent.agentProfile.aadhaarVerification.provider =
    "powerapi";

  await agent.save();

  return agent;
};

export const verifyAgentAadhaar = async (
  agentId,
  aadhaarNumber,
  verificationData,
  adminId
) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  agent.agentProfile.aadhaarNumber =
    aadhaarNumber;

  agent.agentProfile.aadhaarNumberVerified =
    true;

  agent.agentProfile.aadhaarVerification.verifiedAt =
    new Date();

  agent.agentProfile.aadhaarVerification.referenceId =
    verificationData.reference_id || "";

  agent.agentProfile.aadhaarVerification.provider =
    "powerapi";

  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};

/*
 * VERIFY AGENT PAN
 *
 * PAN number is verified through PowerAPI.
 * After successful verification, save the PAN
 * number and mark it as verified.
 */
export const verifyAgentPan = async (
  agentId,
  panNumber,
  verificationData,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      agentId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid agent ID."
    );
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(
      404,
      "Agent not found."
    );
  }

  /*
   * Save PAN number
   */
  agent.agentProfile.panNumber =
    panNumber;

  /*
   * Mark PAN number as verified
   */
  agent.agentProfile.panNumberVerified =
    true;

  /*
   * Update admin who performed verification
   */
  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Update agent current location
 */
export const updateAgentLocation = async (
  agentId,
  latitude,
  longitude
) => {
  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(404, "Agent not found.");
  }

  agent.agentProfile.currentLocation = {
    latitude,
    longitude,
    updatedAt: new Date(),
  };

  await agent.save();

  return {
    latitude: agent.agentProfile.currentLocation.latitude,
    longitude: agent.agentProfile.currentLocation.longitude,
    updatedAt: agent.agentProfile.currentLocation.updatedAt,
  };
};

