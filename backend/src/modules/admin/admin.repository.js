import User from "../../models/User.js";

/* ADMIN */

export const findAdminByEmail = async (email) => {
  return User.findOne({
    email,
    role: "admin",
    status: "active",
  }).select("+password");
};

export const updateAdminLastLogin = async (adminId) => {
  return User.findByIdAndUpdate(
    adminId,
    {
      lastLogin: new Date(),
    },
    {
      new: true,
    }
  );
};

export const findAdminById = async (adminId) => {
  return User.findOne({
    _id: adminId,
    role: "admin",
    status: "active",
  });
};

export const updateAdminProfile = async (adminId, data) => {
  return User.findByIdAndUpdate(
    adminId,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const findAdminWithPasswordById = async (adminId) => {
  return User.findOne({
    _id: adminId,
    role: "admin",
    status: "active",
  }).select("+password");
};

export const updateAdminPassword = async (
  adminId,
  hashedPassword
) => {
  return User.findByIdAndUpdate(
    adminId,
    {
      password: hashedPassword,
    },
    {
      new: true,
    }
  );
};

