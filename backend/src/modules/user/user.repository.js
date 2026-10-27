
import mongoose from "mongoose";
import ApiError from "../../utils/errors/ApiError.js";
import User from "../../models/User.js";
import { getPagination } from "../../utils/pagination/paginate.js";
import Order from "../../models/Order.js";
import PayoutAccount from "../../models/PayoutAccount.js";

// Get All Users
export const getUsers = async (queryParams) => {
  const filter = {
    role: "user",
    status: { $ne: "deleted" },
  };

  const { page, limit, skip } = getPagination(queryParams);

  const {
    search,
    status,
    sortBy = "createdAt",
    order = "desc",
  } = queryParams;

  // Search
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Status Filter
  if (status) {
    filter.status = status;
  }

  // Allowed Sort Fields
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

  const users = await User.find(filter)
    .select(
      "fullName phone email profileImage role status isPhoneVerified createdAt"
    )
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      limit,
    },
  };
};

// Get User By ID
export const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: userId,
    role: "user",
    status: { $ne: "deleted" },
  }).select(
    "fullName phone email profileImage role status isPhoneVerified createdAt updatedAt"
  );

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return user;
};

// Update User
export const updateUser = async (userId, data) => {
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  // Check if user exists
  const user = await User.findOne({
    _id: userId,
    role: "user",
    status: { $ne: "deleted" },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Allow only specific fields
  const updateData = {};

  if (data.fullName !== undefined) {
    updateData.fullName = data.fullName;
  }

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.profileImage !== undefined) {
    updateData.profileImage = data.profileImage;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  // Check email uniqueness
  if (updateData.email) {
    const existingUser = await User.findOne({
      email: updateData.email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(409, "Email already exists.");
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).select(
    "fullName phone email profileImage role status isPhoneVerified createdAt updatedAt"
  );

  return updatedUser;
};

// Update User Status
export const updateUserStatus = async (userId, status) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  // Allow only valid status values
  if (!["active", "blocked"].includes(status)) {
    throw new ApiError(
      400,
      "Status must be either 'active' or 'blocked'."
    );
  }

  // Check if user exists
  const user = await User.findOne({
    _id: userId,
    role: "user",
    status: { $ne: "deleted" },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Update status
  user.status = status;
  await user.save();

  return user;
};

// Delete User
export const deleteUser = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: userId,
    role: "user",
    status: { $ne: "deleted" },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Soft delete
  user.status = "deleted";
  await user.save();

  return;
};

// Get User Details
export const getUserDetails = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: userId,
    role: "user",
    status: { $ne: "deleted" },
  })
    .select(
      "fullName phone email profileImage role status isPhoneVerified address lastLogin createdAt updatedAt"
    )
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const [orders, payoutAccount] = await Promise.all([
    Order.find({ customer: userId })
      .select(
        "orderNumber status device payment pickup.verification.customerPhoto pickup.verification.aadhaar.document pickup.verification.aadhaar.xml createdAt updatedAt"
      )
      .populate("device")
      .sort({ createdAt: -1 })
      .lean(),

    PayoutAccount.findOne({
      user: userId,
      status: "active",
    })
      .select("+bankAccountNumber -cashfreeBeneficiaryId")
      .lean(),
  ]);

  const completedPayments = orders.filter(
    (order) => order.payment?.status === "completed"
  );

  const totalPaid = completedPayments.reduce(
    (total, order) =>
      total + (Number(order.payment?.finalAmount) || 0),
    0
  );

  const maskAccountNumber = (value) => {
    if (!value) return "";
    if (value.length <= 4) return "****";

    return `${"*".repeat(
      Math.min(value.length - 4, 8)
    )}${value.slice(-4)}`;
  };

  const safePayoutAccount = payoutAccount
    ? {
        type: payoutAccount.type,
        accountHolderName: payoutAccount.accountHolderName,
        bankAccountNumber: maskAccountNumber(
          payoutAccount.bankAccountNumber
        ),
        bankIfsc: payoutAccount.bankIfsc,
        upiId: payoutAccount.upiId,
        isVerified: payoutAccount.isVerified,
        verifiedAt: payoutAccount.verifiedAt,
        status: payoutAccount.status,
        createdAt: payoutAccount.createdAt,
      }
    : null;

  return {
    user,
    stats: {
      totalOrders: orders.length,
      completedOrders: orders.filter(
        (order) => order.status === "completed"
      ).length,
      totalPaid,
      paidOrders: completedPayments.length,
    },
    orders,
    payoutAccount: safePayoutAccount,
  };
};
