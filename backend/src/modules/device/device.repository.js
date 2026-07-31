import mongoose from "mongoose";
import Device from "../../models/Device.js";
import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";

export const createDevice = async (deviceData, adminId) => {
  const existingDevice = await Device.findOne({
  $or: [
    { imei1: deviceData.imei1 },
    ...(deviceData.imei2 ? [{ imei2: deviceData.imei2 }] : []),
  ],
});

if (existingDevice) {
  throw new ApiError(
    409,
    "A device with one of the IMEI numbers already exists."
  );
}

  const device = await Device.create({
    ...deviceData,
    createdBy: adminId,
  });

  return device;
};

export const getDevices = async (queryParams) => {
  const filter = {};

  const { page, limit, skip } = getPagination(queryParams);

  const {
    search,
    status,
    brand,
    sortBy = "createdAt",
    order = "desc",
  } = queryParams;

  if (search) {
    filter.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { imei1: { $regex: search, $options: "i" } },
      { serialNumber: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (brand) {
    filter.brand = brand;
  }

  const allowedSortFields = [
    "brand",
    "model",
    "purchasePrice",
    "expectedSellingPrice",
    "status",
    "createdAt",
  ];

  const sortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sort = {
    [sortField]: order === "asc" ? 1 : -1,
  };

  const devices = await Device.find(filter)
    .populate("customer", "fullName phone")
    .populate("pickupAgent", "fullName phone")
    .populate("inspectionAgent", "fullName phone")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalDevices = await Device.countDocuments(filter);

  return {
    devices,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalDevices / limit),
      totalDevices,
      limit,
    },
  };
};

export const getDeviceById = async (deviceId) => {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) {
    throw new ApiError(400, "Invalid device ID.");
  }

  const device = await Device.findById(deviceId)
    .populate("customer", "fullName phone email")
    .populate("pickupAgent", "fullName phone email")
    .populate("inspectionAgent", "fullName phone email")
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");

  if (!device) {
    throw new ApiError(404, "Device not found.");
  }

  return device;
};

export const updateDevice = async (
  deviceId,
  deviceData,
  adminId
) => {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) {
    throw new ApiError(400, "Invalid device ID.");
  }

  const device = await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(404, "Device not found.");
  }

  // Prevent duplicate IMEI
const existingDevice = await Device.findOne({
  _id: { $ne: deviceId },
  $or: [
    ...(deviceData.imei1 ? [{ imei1: deviceData.imei1 }] : []),
    ...(deviceData.imei2 ? [{ imei2: deviceData.imei2 }] : []),
  ],
});

if (existingDevice) {
  throw new ApiError(
    409,
    "A device with one of the IMEI numbers already exists."
  );
}

  const fields = [
    "brand",
    "model",
    "variant",
    "color",
    "storage",
    "ram",
    "imei1",
    "imei2",
    "serialNumber",
    "purchasePrice",
    "expectedSellingPrice",
    "customer",
    "pickupAgent",
    "inspectionAgent",
  ];

  fields.forEach((field) => {
    if (deviceData[field] !== undefined) {
      device[field] = deviceData[field];
    }
  });

  device.updatedBy = adminId;

  await device.save();

  return await Device.findById(deviceId)
    .populate("customer", "fullName phone")
    .populate("pickupAgent", "fullName phone")
    .populate("inspectionAgent", "fullName phone");
};

export const updateDeviceStatus = async (
  deviceId,
  status,
  adminId
) => {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) {
    throw new ApiError(400, "Invalid device ID.");
  }

  const device = await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(404, "Device not found.");
  }

  device.status = status;
  device.updatedBy = adminId;

  await device.save();

  return device;
};

export const deleteDevice = async (deviceId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) {
    throw new ApiError(400, "Invalid device ID.");
  }

  const device = await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(404, "Device not found.");
  }

  device.status = "deleted";// or introduce a separate "deleted" status if preferred
  device.deletedAt = new Date();
  device.updatedBy = adminId;

  await device.save();

  return;
};