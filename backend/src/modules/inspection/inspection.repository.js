import mongoose from "mongoose";

import Inspection from "../../models/Inspection.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";

import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";

// =====================================================
// HELPER
// =====================================================

const populateInspection = (query) => {
  return query
    .populate("order")
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
    )
    .populate(
      "imeiVerification.verifiedBy",
      "fullName email"
    );
};

// =====================================================
// CREATE INSPECTION
// =====================================================

export const createInspection = async (
  inspectionData,
  userId
) => {
  const {
    order: orderId,
    device: deviceId,
  } = inspectionData;


  // 1. Validate Order ID


  if (
    !mongoose.Types.ObjectId.isValid(
      orderId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid order ID."
    );
  }


  // 2. Validate Device ID


  if (
    !mongoose.Types.ObjectId.isValid(
      deviceId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid device ID."
    );
  }


  // 3. Find Order


  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new ApiError(
      404,
      "Order not found."
    );
  }


  // 4. Make sure order belongs to device


  if (
    !order.device ||
    order.device.toString() !==
      deviceId.toString()
  ) {
    throw new ApiError(
      400,
      "The selected device does not belong to this order."
    );
  }


  // 5. Order must be waiting for inspection


  if (
    order.status !==
    "inspection_pending"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be started because the order status is "${order.status}".`
    );
  }


  // 6. Find Device


  const device =
    await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(
      404,
      "Device not found."
    );
  }


  // 7. Prevent duplicate inspection


  const existingInspection =
    await Inspection.findOne({
      order: orderId,
    });

  if (existingInspection) {
    throw new ApiError(
      409,
      "Inspection already exists for this order."
    );
  }


  // 8. Create Inspection


  const inspection =
    await Inspection.create({
      ...inspectionData,

      order: orderId,

      device: deviceId,

      inspectionAgent: userId,

      status: "in_progress",

      createdBy: userId,

      updatedBy: userId,
    });


  // 9. Update Device


  device.inspectionAgent =
    userId;

  device.status =
    "inspection_pending";

  device.updatedBy =
    userId;

  await device.save();


  // 10. Update Order


  order.status =
    "inspection_in_progress";

  order.inspection.status =
    "in_progress";

  order.inspection.inspectedBy =
    userId;

  order.inspection.inspectedAt =
    null;

  order.updatedBy =
    userId;

  order.timeline.push({
    status:
      "inspection_in_progress",

    message:
      "Device inspection started.",

    performedBy: userId,
  });

  await order.save();


  // 11. Return Inspection


  return populateInspection(
    Inspection.findById(
      inspection._id
    )
  );
};

// =====================================================
// GET ALL INSPECTIONS
// =====================================================

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
    order: orderParam = "desc",
    sortBy = "createdAt",
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
    "updatedAt",
  ];

  const sortField =
    allowedSortFields.includes(
      sortBy
    )
      ? sortBy
      : "createdAt";

  const sort = {
    [sortField]:
      orderParam === "asc"
        ? 1
        : -1,
  };


  // Fetch inspections


  const inspections =
    await populateInspection(
      Inspection.find(filter)
    )
      .sort(sort)
      .skip(skip)
      .limit(limit);


  // Count


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

// =====================================================
// GET INSPECTION BY ID
// =====================================================

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


  // Find inspection


  const inspection =
    await populateInspection(
      Inspection.findById(
        inspectionId
      )
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  return inspection;
};

// =====================================================
// UPDATE INSPECTION DETAILS
// =====================================================

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


  // 3. Only edit while in progress


  if (
    inspection.status !==
    "in_progress"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be edited because its current status is "${inspection.status}".`
    );
  }


  // SIMPLE FIELDS


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


  // FUNCTIONAL TESTS


  if (
    inspectionData.functionalTests
  ) {
    inspection.functionalTests = {
      ...(
        inspection.functionalTests
          ?.toObject?.() ||
        inspection.functionalTests ||
        {}
      ),

      ...inspectionData.functionalTests,
    };
  }


  // ACCESSORIES


  if (
    inspectionData.accessories
  ) {
    inspection.accessories = {
      ...(
        inspection.accessories
          ?.toObject?.() ||
        inspection.accessories ||
        {}
      ),

      ...inspectionData.accessories,
    };
  }


  // REPAIR HISTORY


  if (
    inspectionData.repairHistory
  ) {
    inspection.repairHistory = {
      ...(
        inspection.repairHistory
          ?.toObject?.() ||
        inspection.repairHistory ||
        {}
      ),

      ...inspectionData.repairHistory,
    };
  }


  // IMEI VERIFICATION


  if (
    inspectionData.imeiVerification
  ) {
    inspection.imeiVerification = {
      ...(
        inspection.imeiVerification
          ?.toObject?.() ||
        inspection.imeiVerification ||
        {}
      ),

      ...inspectionData.imeiVerification,

      verifiedBy:
        inspectionData
          .imeiVerification
          .verified === true
          ? userId
          : inspection
              .imeiVerification
              ?.verifiedBy,

      verifiedAt:
        inspectionData
          .imeiVerification
          .verified === true
          ? new Date()
          : inspection
              .imeiVerification
              ?.verifiedAt,
    };
  }


  // AUDIT


  inspection.updatedBy =
    userId;


  // SAVE


  await inspection.save();


  // RETURN UPDATED INSPECTION


  return populateInspection(
    Inspection.findById(
      inspectionId
    )
  );
};

// =====================================================
// UPDATE INSPECTION STATUS
// =====================================================

export const updateInspectionStatus = async (
  inspectionId,
  status,
  userId
) => {

  // 1. Validate ID


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


  // 3. Inspection must be in progress


  if (
    inspection.status !==
    "in_progress"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be updated because its current status is "${inspection.status}".`
    );
  }


  // 4. Only approve/reject


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


  // 5. Find Device


  const device =
    await Device.findById(
      inspection.device
    );

  if (!device) {
    throw new ApiError(
      404,
      "Device not found."
    );
  }


  // 6. Find Order


  const order =
    await Order.findById(
      inspection.order
    );

  if (!order) {
    throw new ApiError(
      404,
      "Related order not found."
    );
  }


  // 7. Validate Order / Device relationship


  if (
    !order.device ||
    order.device.toString() !==
      inspection.device.toString()
  ) {
    throw new ApiError(
      400,
      "Inspection, order and device relationship is invalid."
    );
  }


  // 8. Complete inspection


  const now = new Date();

  inspection.status =
    status;

  inspection.updatedBy =
    userId;

  inspection.completedAt =
    now;

  if (status === "rejected") {
    inspection.rejectionReason =
      inspection.rejectionReason ||
      "Device rejected after inspection.";
  }

  await inspection.save();


  // 9. Update Device


  device.updatedBy =
    userId;

  if (status === "approved") {
    device.status =
      "approved";
  }

  if (status === "rejected") {
    device.status =
      "rejected";
  }

  await device.save();


  // 10. Update Order


  order.updatedBy =
    userId;

  // ===================================================
  // APPROVED
  // ===================================================

  if (status === "approved") {
    /*
     * Inspection is approved.
     *
     * Payment is the next business step.
     *
     * Inventory is NOT created here.
     */

    order.status =
      "payment_pending";

    order.inspection.status =
      "approved";

    order.inspection.inspectedBy =
      inspection.inspectionAgent;

    order.inspection.inspectedAt =
      now;

    order.inspection.condition =
      inspection.bodyCondition;

    order.inspection.grade =
      inspection.overallGrade;

    order.inspection.physicalCondition =
      inspection.bodyCondition;

    order.inspection.screenCondition =
      inspection.screenCondition;

    order.inspection.batteryHealth =
      inspection.batteryHealth;

    order.inspection.functionalIssues =
      [];

    order.inspection.inspectionNotes =
      inspection.remarks;

    order.inspection.approvedAt =
      now;

    /*
     * Inspection valuation becomes
     * the payment amount.
     */

    const estimatedPrice =
      Number(
        inspection.estimatedPrice
      );

    if (
      Number.isFinite(
        estimatedPrice
      ) &&
      estimatedPrice > 0
    ) {
      order.payment.estimatedAmount =
        estimatedPrice;

      order.payment.finalAmount =
        estimatedPrice;
    }

    order.payment.status =
      "pending";

    order.timeline.push({
      status:
        "inspection_completed",

      message:
        "Device inspection completed and approved. Payment is pending.",

      performedBy: userId,
    });
  }

  // ===================================================
  // REJECTED
  // ===================================================

  if (status === "rejected") {
    order.status =
      "rejected";

    order.inspection.status =
      "rejected";

    order.inspection.inspectedBy =
      inspection.inspectionAgent;

    order.inspection.inspectedAt =
      now;

    order.inspection.rejectionReason =
      inspection.rejectionReason;

    order.timeline.push({
      status: "rejected",

      message:
        inspection.rejectionReason ||
        "Device rejected after inspection.",

      performedBy: userId,
    });
  }


  // SAVE ORDER


  await order.save();


  // RETURN UPDATED INSPECTION


  return populateInspection(
    Inspection.findById(
      inspection._id
    )
  );
};

// =====================================================
// DELETE INSPECTION
// =====================================================

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


  // Do not delete completed inspections


  if (
    [
      "completed",
      "approved",
      "rejected",
    ].includes(
      inspection.status
    )
  ) {
    throw new ApiError(
      400,
      "Completed inspections cannot be deleted."
    );
  }


  // Delete


  await inspection.deleteOne();
};