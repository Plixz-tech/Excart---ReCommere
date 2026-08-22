import mongoose from "mongoose";
import Inspection from "../../models/Inspection.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";
import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";



// ============================================================
// CREATE INSPECTION
// ============================================================

export const createInspection = async (
  inspectionData,
  userId
) => {
  // 1. Validate Device ID
  if (
    !mongoose.Types.ObjectId.isValid(
      inspectionData.device
    )
  ) {
    throw new ApiError(
      400,
      "Invalid device ID."
    );
  }

  // 2. Find related order
  const order = await Order.findOne({
    device: inspectionData.device,
  });

  if (!order) {
    throw new ApiError(
      404,
      "Related order not found."
    );
  }

  // 3. Order must be waiting for inspection
  if (
    order.status !==
    "inspection_pending"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be started because the order status is "${order.status}".`
    );
  }

  // 4. Make sure device exists
  const device = await Device.findById(
    inspectionData.device
  );

  if (!device) {
    throw new ApiError(
      404,
      "Device not found."
    );
  }

  // 5. Make sure inspection does not already exist
  const existingInspection =
    await Inspection.findOne({
      device: inspectionData.device,
    });

  if (existingInspection) {
    throw new ApiError(
      409,
      "Inspection already exists for this device."
    );
  }

  // 6. Create inspection
  const inspection =
    await Inspection.create({
      ...inspectionData,

      // Logged-in admin performing inspection
      inspectionAgent: userId,

      // Inspection starts immediately
      status: "in_progress",

      createdBy: userId,
      updatedBy: userId,
    });

  // 7. Update device
device.inspectionAgent = userId;

device.status =
  "inspection_pending";

device.updatedBy = userId;

  await device.save();

  // 8. Update order
  order.status =
    "inspection_in_progress";

  order.updatedBy = userId;

  order.timeline.push({
    status:
      "inspection_in_progress",

    message:
      "Inspection started by admin.",

    performedBy: userId,
  });

  await order.save();

  // 9. Return complete inspection
  return Inspection.findById(
    inspection._id
  )
    .populate("device")
    .populate(
      "inspectionAgent",
      "fullName phone email"
    )
    .populate(
      "createdBy",
      "fullName email"
    )
    .populate(
      "updatedBy",
      "fullName email"
    );
};



// ============================================================
// GET ALL INSPECTIONS
// ============================================================

export const getInspections = async (
  queryParams
) => {
  const filter = {};

  const {
    page,
    limit,
    skip,
  } = getPagination(queryParams);

  const {
    status,
    overallGrade,
    sortBy = "createdAt",
    order = "desc",
  } = queryParams;

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Filter by grade
  if (overallGrade) {
    filter.overallGrade =
      overallGrade;
  }

  // Allowed sorting fields
  const allowedSortFields = [
    "batteryHealth",
    "estimatedPrice",
    "overallGrade",
    "status",
    "createdAt",
  ];

  const sortField =
    allowedSortFields.includes(
      sortBy
    )
      ? sortBy
      : "createdAt";

  const sort = {
    [sortField]:
      order === "asc"
        ? 1
        : -1,
  };

  const inspections =
    await Inspection.find(filter)
      .populate("device")
      .populate(
        "inspectionAgent",
        "fullName phone"
      )
      .populate(
        "createdBy",
        "fullName"
      )
      .populate(
        "updatedBy",
        "fullName"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit);

  const totalInspections =
    await Inspection.countDocuments(
      filter
    );

  return {
    inspections,

    pagination: {
      currentPage: page,

      totalPages:
        Math.ceil(
          totalInspections /
            limit
        ),

      totalInspections,

      limit,
    },
  };
};



// ============================================================
// GET INSPECTION BY ID
// ============================================================

export const getInspectionById = async (
  inspectionId
) => {
  // Validate ID
  if (
    !mongoose.Types.ObjectId.isValid(
      inspectionId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid inspection ID."
    );
  }

  const inspection =
    await Inspection.findById(
      inspectionId
    )
      .populate("device")
      .populate(
        "inspectionAgent",
        "fullName phone email"
      )
      .populate(
        "createdBy",
        "fullName email"
      )
      .populate(
        "updatedBy",
        "fullName email"
      );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  return inspection;
};



// ============================================================
// UPDATE INSPECTION DETAILS
// ============================================================

export const updateInspection = async (
  inspectionId,
  inspectionData,
  userId
) => {
  // 1. Validate inspection ID
  if (
    !mongoose.Types.ObjectId.isValid(
      inspectionId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid inspection ID."
    );
  }

  // 2. Find inspection
  const inspection =
    await Inspection.findById(
      inspectionId
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  // 3. Only allow editing
  // while inspection is in progress
  if (
    inspection.status !==
    "in_progress"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be edited because its current status is "${inspection.status}".`
    );
  }


  // ==========================================================
  // SIMPLE FIELDS
  // ==========================================================

  if (
    inspectionData.screenCondition !==
    undefined
  ) {
    inspection.screenCondition =
      inspectionData.screenCondition;
  }

  if (
    inspectionData.bodyCondition !==
    undefined
  ) {
    inspection.bodyCondition =
      inspectionData.bodyCondition;
  }

  if (
    inspectionData.batteryHealth !==
    undefined
  ) {
    inspection.batteryHealth =
      inspectionData.batteryHealth;
  }

  if (
    inspectionData.overallGrade !==
    undefined
  ) {
    inspection.overallGrade =
      inspectionData.overallGrade;
  }

  if (
    inspectionData.estimatedPrice !==
    undefined
  ) {
    inspection.estimatedPrice =
      inspectionData.estimatedPrice;
  }

  if (
    inspectionData.remarks !==
    undefined
  ) {
    inspection.remarks =
      inspectionData.remarks;
  }


  // ==========================================================
  // FUNCTIONAL TESTS
  // ==========================================================

  // IMPORTANT:
  // Merge instead of replacing the entire object.
  //
  // Example:
  //
  // {
  //   "functionalTests": {
  //      "camera": false
  //   }
  // }
  //
  // will only change camera.
  //
  // Other values remain unchanged.

  if (
    inspectionData.functionalTests
  ) {
    inspection.functionalTests = {
      ...(inspection.functionalTests?.toObject?.() ||
        inspection.functionalTests ||
        {}),

      ...inspectionData.functionalTests,
    };
  }


  // ==========================================================
  // ACCESSORIES
  // ==========================================================

  if (
    inspectionData.accessories
  ) {
    inspection.accessories = {
      ...(inspection.accessories?.toObject?.() ||
        inspection.accessories ||
        {}),

      ...inspectionData.accessories,
    };
  }


  // ==========================================================
  // REPAIR HISTORY
  // ==========================================================

  if (
    inspectionData.repairHistory
  ) {
    inspection.repairHistory = {
      ...(inspection.repairHistory?.toObject?.() ||
        inspection.repairHistory ||
        {}),

      ...inspectionData.repairHistory,
    };
  }


  // ==========================================================
  // IMEI VERIFICATION
  // ==========================================================

  if (
    inspectionData.imeiVerification
  ) {
    inspection.imeiVerification = {
      ...(inspection.imeiVerification?.toObject?.() ||
        inspection.imeiVerification ||
        {}),

      ...inspectionData.imeiVerification,
    };
  }


  // ==========================================================
  // AUDIT
  // ==========================================================

  inspection.updatedBy = userId;


  // ==========================================================
  // SAVE
  // ==========================================================

  await inspection.save();


  // ==========================================================
  // RETURN UPDATED INSPECTION
  // ==========================================================

  return Inspection.findById(
    inspectionId
  )
    .populate("device")
    .populate(
      "inspectionAgent",
      "fullName phone email"
    )
    .populate(
      "createdBy",
      "fullName email"
    )
    .populate(
      "updatedBy",
      "fullName email"
    );
};



// ============================================================
// UPDATE INSPECTION STATUS
// ============================================================

export const updateInspectionStatus = async (
  inspectionId,
  status,
  userId
) => {
  // 1. Validate inspection ID
  if (
    !mongoose.Types.ObjectId.isValid(
      inspectionId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid inspection ID."
    );
  }

  // 2. Find inspection
  const inspection =
    await Inspection.findById(
      inspectionId
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  // 3. Find related order
  const order =
    await Order.findOne({
      device: inspection.device,
    });

  if (!order) {
    throw new ApiError(
      404,
      "Related order not found."
    );
  }


  // ==========================================================
  // STATUS VALIDATION
  // ==========================================================

  // Inspection must currently
  // be in progress.

  if (
    inspection.status !==
    "in_progress"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be updated because its current status is "${inspection.status}".`
    );
  }


  // Only approve or reject
  if (
    ![
      "approved",
      "rejected",
    ].includes(status)
  ) {
    throw new ApiError(
      400,
      "Inspection can only be approved or rejected."
    );
  }


  // ==========================================================
  // UPDATE INSPECTION
  // ==========================================================

  inspection.status = status;

  inspection.updatedBy =
    userId;

  // Inspection is finished
  inspection.completedAt =
    new Date();

  await inspection.save();


  // ==========================================================
  // UPDATE DEVICE
  // ==========================================================

  const device =
    await Device.findById(
      inspection.device
    );

  if (device) {
    device.updatedBy =
      userId;

    if (
      status ===
      "approved"
    ) {
      device.status =
        "approved";
    }

    if (
      status ===
      "rejected"
    ) {
      device.status =
        "rejected";
    }

    await device.save();
  }


  // ==========================================================
  // UPDATE ORDER
  // ==========================================================

  order.updatedBy =
    userId;


  // ----------------------------------------------------------
  // APPROVED
  // ----------------------------------------------------------

  if (
    status ===
    "approved"
  ) {
    order.status =
      "ready_stock";

    order.timeline.push({
      status:
        "approved",

      message:
        "Device inspection approved by admin.",

      performedBy:
        userId,
    });
  }


  // ----------------------------------------------------------
  // REJECTED
  // ----------------------------------------------------------

  if (
    status ===
    "rejected"
  ) {
    order.status =
      "rejected";

    order.timeline.push({
      status:
        "rejected",

      message:
        "Device rejected after inspection.",

      performedBy:
        userId,
    });
  }


  await order.save();


  // ==========================================================
  // RETURN UPDATED INSPECTION
  // ==========================================================

  return Inspection.findById(
    inspection._id
  )
    .populate("device")
    .populate(
      "inspectionAgent",
      "fullName phone email"
    )
    .populate(
      "createdBy",
      "fullName email"
    )
    .populate(
      "updatedBy",
      "fullName email"
    );
};



// ============================================================
// DELETE INSPECTION
// ============================================================

export const deleteInspection = async (
  inspectionId
) => {
  // Validate ID
  if (
    !mongoose.Types.ObjectId.isValid(
      inspectionId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid inspection ID."
    );
  }

  // Find inspection
  const inspection =
    await Inspection.findById(
      inspectionId
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  // Delete
  await inspection.deleteOne();

  return;
};