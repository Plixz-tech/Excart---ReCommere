import mongoose from "mongoose";
import User from "../../models/User.js";
import ApiError from "../../utils/errors/ApiError.js";
import bcrypt from "bcrypt";
import { getPagination } from "../../utils/pagination/paginate.js";

import cloudinary from "../../lib/cloudinary.js";
import streamifier from "streamifier";

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
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
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

export const createAgent = async (agentData, adminId) => {
  const { fullName, email, phone, countryCode, password } = agentData;

  const existingEmail = await User.findOne({
    email: email.toLowerCase(),
    status: { $ne: "deleted" },
  });

  if (existingEmail) {
    throw new ApiError(409, "Email already exists.");
  }

  const existingPhone = await User.findOne({
    phone,
    status: { $ne: "deleted" },
  });

  if (existingPhone) {
    throw new ApiError(409, "Phone number already exists.");
  }

  const lastAgent = await User.findOne({
    role: "agent",
  })
    .sort({ createdAt: -1 })
    .select("agentProfile.agentId");

  let nextNumber = 1;

  if (lastAgent?.agentProfile?.agentId) {
    nextNumber =
      parseInt(lastAgent.agentProfile.agentId.replace("AGT", ""), 10) + 1;
  }

  const agentId = `AGT${String(nextNumber).padStart(6, "0")}`;

  const hashedPassword = await bcrypt.hash(password, 10);

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

export const updateAgent = async (agentId, agentData, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(404, "Agent not found.");
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
      throw new ApiError(409, "Email already exists.");
    }
  }

  if (phone) {
    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: agentId },
      status: { $ne: "deleted" },
    });

    if (existingPhone) {
      throw new ApiError(409, "Phone number already exists.");
    }
  }

  if (fullName !== undefined) agent.fullName = fullName;
  if (email !== undefined) agent.email = email;
  if (phone !== undefined) agent.phone = phone;
  if (countryCode !== undefined) agent.countryCode = countryCode;

  if (profileImage !== undefined) {
    agent.profileImage = profileImage;
  }

  if (agentProfile) {
    if (agentProfile.experience !== undefined) {
      agent.agentProfile.experience = agentProfile.experience;
    }

    if (agentProfile.alternatePhone !== undefined) {
      agent.agentProfile.alternatePhone = agentProfile.alternatePhone;
    }

    if (agentProfile.operatingArea !== undefined) {
      agent.agentProfile.operatingArea = agentProfile.operatingArea;
    }

    if (agentProfile.onboardingDate !== undefined) {
      agent.agentProfile.onboardingDate = agentProfile.onboardingDate;
    }

    if (agentProfile.workingHours) {
      if (agentProfile.workingHours.start !== undefined) {
        agent.agentProfile.workingHours.start = agentProfile.workingHours.start;
      }

      if (agentProfile.workingHours.end !== undefined) {
        agent.agentProfile.workingHours.end = agentProfile.workingHours.end;
      }
    }

    if (agentProfile.address) {
      Object.assign(agent.agentProfile.address, agentProfile.address);
    }

    if (agentProfile.coverage) {
      Object.assign(agent.agentProfile.coverage, agentProfile.coverage);
    }
  }
  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};

export const updateAgentStatus = async (agentId, status) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(404, "Agent not found.");
  }

  agent.status = status;

  await agent.save();

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};

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
    throw new ApiError(404, "Agent not found.");
  }

  agent.status = "deleted";
  agent.deletedAt = new Date();

  // Free unique values
  agent.email = `${Date.now()}_${agent.email}`;
  agent.phone = `${Date.now()}_${agent.phone}`;

  await agent.save();

  return;
};
export const uploadDocuments = async (agentId, files, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(agentId)) {
    throw new ApiError(400, "Invalid agent ID.");
  }

  const agent = await User.findOne({
    _id: agentId,
    role: "agent",
    status: { $ne: "deleted" },
  });

  if (!agent) {
    throw new ApiError(404, "Agent not found.");
  }

  const documents = agent.agentProfile.verificationDocuments;

  const documentFields = [
    "aadhaar",
    "panCard",
    "drivingLicense",
    "policeClearance",
    "photo",
  ];

  for (const field of documentFields) {
    if (!files?.[field]?.length) continue;

    // Delete old document from Cloudinary
    if (documents[field]?.publicId) {
      await cloudinary.uploader.destroy(documents[field].publicId);
    }

    const file = files[field][0];

    const uploadedDocument = await uploadToCloudinary(
      file,
      `agents/${agent.agentProfile.agentId}/${field}`
    );

    // Save uploaded document
    documents[field] = uploadedDocument;

    // Reset verification details
    documents[field].verified = false;
    documents[field].verifiedAt = null;
    documents[field].verifiedBy = null;
    documents[field].rejected = false;
    documents[field].rejectionReason = "";

    // Aadhaar upload should NOT verify automatically
    if (field === "aadhaar") {
      agent.agentProfile.aadhaarVerified = false;
      agent.agentProfile.aadhaarNumber = "";

      documents.aadhaar.verified = false;
      documents.aadhaar.verifiedAt = null;
      documents.aadhaar.verifiedBy = null;
      documents.aadhaar.rejected = false;
      documents.aadhaar.rejectionReason = "";
    }

    // PAN upload should verify automatically (Mock)
    if (field === "panCard") {
      // Reset previous PAN
      agent.agentProfile.panNumber = "";
      agent.agentProfile.panVerified = false;

      // Mock extraction
      const extractedPanNumber = "ABCDE1234F";

      agent.agentProfile.panNumber = extractedPanNumber;
      agent.agentProfile.panVerified = true;

      documents.panCard.verified = true;
      documents.panCard.verifiedAt = new Date();
      documents.panCard.verifiedBy = adminId;
      documents.panCard.rejected = false;
      documents.panCard.rejectionReason = "";
    }
  }

  agent.updatedBy = adminId;

  await agent.save();

  return await User.findById(agentId).select(
    "-password -googleId -facebookId"
  );
};