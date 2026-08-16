import mongoose from "mongoose";
import User from "../../models/User.js";
import ApiError from "../../utils/errors/ApiError.js";
import bcrypt from "bcrypt";
import { getPagination } from "../../utils/pagination/paginate.js";

import cloudinary from "../../lib/cloudinary.js";
import streamifier from "streamifier";

import * as aadhaarService from "../../services/aadhaar.service.js";
import * as panService from "../../services/pan.service.js";

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

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
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
 * Get all agents
 */
export const getAgents = async (queryParams) => {
  const filter = {
    role: "agent",
    status: { $ne: "deleted" },
  };

  const { page, limit, skip } = getPagination(queryParams);

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

  const sortField = allowedSortFields.includes(sortBy)
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

  const totalAgents = await User.countDocuments(filter);

  return {
    agents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalAgents / limit),
      totalAgents,
      limit,
    },
  };
};

/**
 * Get agent by ID
 */
export const getAgentById = async (agentId) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  }).select("-password -googleId -facebookId");

  if (!agent) {
    throw new ApiError(404, "Agent not found.");
  }

  return agent;
};

/**
 * Create agent
 */
export const createAgent = async (agentData, adminId) => {
  const {
    fullName,
    email,
    phone,
    countryCode,
    password,
  } = agentData;

  const existingEmail = await User.findOne({
    email: email.toLowerCase(),
    status: { $ne: "deleted" },
  });

  if (existingEmail) {
    throw new ApiError(
      409,
      "Email already exists."
    );
  }

  const existingPhone = await User.findOne({
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

  const agentId = `AGT${String(nextNumber).padStart(
    6,
    "0"
  )}`;

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const agent = await User.create({
    fullName,
    email,
    phone,
    countryCode,
    password: hashedPassword,

    role: "agent",
    status: "active",
    isPhoneVerified: true,

    createdBy: adminId,

    agentProfile: {
      agentId,
    },
  });

  return await User.findById(agent._id).select(
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
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
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
    const existingEmail = await User.findOne({
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
    const existingPhone = await User.findOne({
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
      agentProfile.alternatePhone !== undefined
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

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Update agent status
 */
export const updateAgentStatus = async (
  agentId,
  status
) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
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

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};

/**
 * Delete agent
 */
export const deleteAgent = async (agentId) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
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
 * Aadhaar:
 *   1. Upload document
 *   2. Verify document using external API
 *   3. Mark document as verified only if API succeeds
 *
 * PAN:
 *   1. Upload document
 *   2. Verify document using external API
 *   3. Store extracted PAN number
 *   4. Mark document and PAN number as verified
 *
 * Other documents:
 *   Upload only. No external verification.
 */
export const uploadDocuments = async (
  agentId,
  files,
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

  const documents =
    agent.agentProfile.verificationDocuments;

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
     * -----------------------------------------
     * AADHAAR DOCUMENT VERIFICATION
     * -----------------------------------------
     */

    if (field === "aadhaar") {
      if (
        !agent.agentProfile.aadhaarNumber
      ) {
        await deleteFromCloudinary(
          uploadedDocument.publicId
        );

        throw new ApiError(
          400,
          "Please verify the Aadhaar number before uploading the Aadhaar document."
        );
      }

      if (
        !agent.agentProfile
          .aadhaarNumberVerified
      ) {
        await deleteFromCloudinary(
          uploadedDocument.publicId
        );

        throw new ApiError(
          400,
          "Aadhaar number must be verified before uploading the Aadhaar document."
        );
      }

      /*
       * External Aadhaar document verification
       */
      const verificationResult =
        await aadhaarService.verifyAadhaarDocument(
          {
            documentUrl:
              uploadedDocument.url,
            aadhaarNumber:
              agent.agentProfile.aadhaarNumber,
          }
        );

      if (
        !verificationResult?.verified
      ) {
        await deleteFromCloudinary(
          uploadedDocument.publicId
        );

        throw new ApiError(
          400,
          "Aadhaar document verification failed."
        );
      }

      documents.aadhaar.verified =
        true;

      documents.aadhaar.verifiedAt =
        new Date();

      documents.aadhaar.verifiedBy =
        adminId;

      documents.aadhaar.rejected =
        false;

      documents.aadhaar.rejectionReason =
        "";
    }

    /*
     * -----------------------------------------
     * PAN DOCUMENT VERIFICATION
     * -----------------------------------------
     */

    if (field === "panCard") {
      /*
       * External PAN verification
       */
      const verificationResult =
        await panService.verifyPanDocument(
          {
            documentUrl:
              uploadedDocument.url,
          }
        );

      if (
        !verificationResult?.verified
      ) {
        await deleteFromCloudinary(
          uploadedDocument.publicId
        );

        throw new ApiError(
          400,
          "PAN document verification failed."
        );
      }

      /*
       * Save PAN number returned by
       * external verification service.
       */
      if (
        verificationResult.panNumber
      ) {
        agent.agentProfile.panNumber =
          verificationResult.panNumber;
      }

      agent.agentProfile.panNumberVerified =
        true;

      documents.panCard.verified =
        true;

      documents.panCard.verifiedAt =
        new Date();

      documents.panCard.verifiedBy =
        adminId;

      documents.panCard.rejected =
        false;

      documents.panCard.rejectionReason =
        "";
    }

    /*
     *
     * Driving License
     * Police Clearance
     * Photo
     *
     * These are only uploaded.
     * No external verification for now.
     */
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
 * Verify Aadhaar NUMBER
 *
 * This is separate from Aadhaar document verification.
 *
 * Flow:
 * Admin enters Aadhaar number
 *        ↓
 * External Aadhaar number API
 *        ↓
 * Success
 *        ↓
 * aadhaarNumberVerified = true
 */
export const verifyAadhaar = async (
  agentId,
  aadhaarNumber,
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
   *
   * Surepass integration will be added
   * inside aadhaar.service.js later.
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
   * Do NOT mark the Aadhaar document
   * as verified here.
   */
  agent.agentProfile.aadhaarNumberVerified =
    true;

  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(
    agentId
  ).select(
    "-password -googleId -facebookId"
  );
};