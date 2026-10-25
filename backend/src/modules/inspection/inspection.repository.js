import mongoose from "mongoose";

import Inspection from "../../models/Inspection.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";

import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";
import inventoryService from "../inventory/inventory.service.js";
import Inventory from "../../models/Inventory.js";

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

export const createInspection = async (
  inspectionData,
  userId
) => {
  const {
    order: orderId,
    device: deviceId,
  } = inspectionData;

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

  const order =
    await Order.findById(orderId);

  if (!order) {
    throw new ApiError(
      404,
      "Order not found."
    );
  }

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

  if (
    order.status !==
    "inspection_pending"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be started because the order status is "${order.status}".`
    );
  }

  const device =
    await Device.findById(deviceId);

  if (!device) {
    throw new ApiError(
      404,
      "Device not found."
    );
  }

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

  device.inspectionAgent =
    userId;

  device.status =
    "inspection_in_progress";

  device.updatedBy =
    userId;

  await device.save();

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

  return populateInspection(
    Inspection.findById(
      inspection._id
    )
  );
};

export const getPendingInspections = async (
  queryParams = {}
) => {
  const {
    page,
    limit,
    skip,
  } = getPagination(queryParams);

  const orders =
    await Order.find({
      status: "inspection_pending",
    })
      .populate(
        "customer",
        "fullName phone email"
      )
      .populate("device")
      .populate(
        "agent",
        "fullName phone email"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

  const totalPendingInspections =
    await Order.countDocuments({
      status: "inspection_pending",
    });

  return {
    orders,

    pagination: {
      currentPage: page,

      totalPages:
        Math.ceil(
          totalPendingInspections /
            limit
        ),

      totalPendingInspections,

      limit,
    },
  };
};

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

  if (status) {
    filter.status = status;
  }

  if (overallGrade) {
    filter.overallGrade =
      overallGrade;
  }

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

  const inspections =
    await populateInspection(
      Inspection.find(filter)
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

export const getInspectionById = async (
  inspectionId
) => {
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



export const updateInspection = async (
  inspectionId,
  inspectionData,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
    throw new ApiError(400, "Invalid inspection ID.");
  }

  const inspection = await Inspection.findById(inspectionId);

  if (!inspection) {
    throw new ApiError(404, "Inspection not found.");
  }

  if (inspection.status !== "in_progress") {
    throw new ApiError(
      400,
      `Inspection cannot be edited because its current status is "${inspection.status}".`
    );
  }

  // Update scalar fields only when supplied.
  const scalarFields = [
    "screenCondition",
    "bodyCondition",
    "batteryHealth",
    "overallGrade",
    "estimatedPrice",
    "sellingPrice",
    "remarks",
  ];

  for (const field of scalarFields) {
    if (inspectionData[field] !== undefined) {
      inspection.set(field, inspectionData[field]);
    }
  }

  // Merge nested objects without discarding existing values.
  const nestedFields = [
    "functionalTests",
    "accessories",
    "repairHistory",
  ];

  for (const field of nestedFields) {
    const incoming = inspectionData[field];

    if (incoming && typeof incoming === "object") {
      const current =
        inspection[field]?.toObject?.() ??
        inspection[field]?.toJSON?.() ??
        inspection[field] ??
        {};

      inspection.set(field, {
        ...current,
        ...incoming,
      });
    }
  }

  // Preserve existing IMEI verification behaviour.
  if (inspectionData.imeiVerification) {
    const incoming = inspectionData.imeiVerification;

    const current =
      inspection.imeiVerification?.toObject?.() ??
      inspection.imeiVerification?.toJSON?.() ??
      inspection.imeiVerification ??
      {};

    inspection.set("imeiVerification", {
      ...current,
      ...incoming,
      verifiedBy:
        incoming.verified === true
          ? userId
          : current.verifiedBy,
      verifiedAt:
        incoming.verified === true
          ? new Date()
          : current.verifiedAt,
    });
  }

  inspection.updatedBy = userId;

  // Save all inspection fields, including sellingPrice.
  await inspection.save();

  // Keep the order's inspection summary in sync.
  const order = await Order.findById(inspection.order);

  if (!order) {
    throw new ApiError(404, "Related order not found.");
  }

  if (!order.inspection) {
    order.inspection = {};
  }

  order.inspection.status = inspection.status;
  order.inspection.inspectedBy = inspection.inspectionAgent;
  order.inspection.condition = inspection.bodyCondition;
  order.inspection.physicalCondition = inspection.bodyCondition;
  order.inspection.screenCondition = inspection.screenCondition;
  order.inspection.batteryHealth = inspection.batteryHealth;
  order.inspection.grade = inspection.overallGrade;
  order.inspection.inspectionNotes = inspection.remarks;
  order.updatedBy = userId;

  await order.save();

  // Return the latest saved document with populated references.
  return populateInspection(
    Inspection.findById(inspection._id)
  );
};



export const completeInspection = async (
  inspectionId,
  userId
) => {
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
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

  if (
    inspection.status !==
    "in_progress"
  ) {
    throw new ApiError(
      400,
      `Inspection cannot be completed because its current status is "${inspection.status}".`
    );
  }

  if (
    !inspection.screenCondition
  ) {
    throw new ApiError(
      400,
      "Screen condition is required before completing the inspection."
    );
  }

  if (
    !inspection.bodyCondition
  ) {
    throw new ApiError(
      400,
      "Body condition is required before completing the inspection."
    );
  }

  if (
    inspection.batteryHealth ===
      undefined ||
    inspection.batteryHealth ===
      null
  ) {
    throw new ApiError(
      400,
      "Battery health is required before completing the inspection."
    );
  }

  if (
    !inspection.functionalTests
  ) {
    throw new ApiError(
      400,
      "Functional tests are required before completing the inspection."
    );
  }

  if (
    !inspection.accessories
  ) {
    throw new ApiError(
      400,
      "Accessories details are required before completing the inspection."
    );
  }

  if (
    !inspection.repairHistory
  ) {
    throw new ApiError(
      400,
      "Repair history is required before completing the inspection."
    );
  }

  /*
   * IMEI verification is intentionally not required.
   * ExCart only collects the IMEI number at this stage.
   */

  if (
    !inspection.overallGrade
  ) {
    throw new ApiError(
      400,
      "Overall grade is required before completing the inspection."
    );
  }

  if (
    inspection.estimatedPrice ===
      undefined ||
    inspection.estimatedPrice ===
      null ||
    inspection.estimatedPrice <= 0
  ) {
    throw new ApiError(
      400,
      "A valid estimated price is required before completing the inspection."
    );
  }

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

  const device =
    await Device.findById(
      inspection.device
    );

  if (!device) {
    throw new ApiError(
      404,
      "Related device not found."
    );
  }

  const now = new Date();

  device.status =
    "inspection_completed";

  device.updatedBy =
    userId;

  await device.save();

  inspection.status =
    "completed";

  inspection.completedAt =
    now;

  inspection.updatedBy =
    userId;

  await inspection.save();

  order.status =
    "inspection_completed";

  order.inspection.status =
    "completed";

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

  order.inspection.inspectionNotes =
    inspection.remarks;

  order.updatedBy =
    userId;

  order.timeline.push({
    status:
      "inspection_completed",

    message:
      "Device inspection completed. Awaiting approval.",

    performedBy: userId,
  });

  await order.save();

  return populateInspection(
    Inspection.findById(
      inspection._id
    )
  );
};


export const updateInspectionStatus = async (
  inspectionId,
  status,
  reason,
  userId
) => {
  const session = await mongoose.startSession();

  try {
    let updatedInspection;

    await session.withTransaction(async () => {
      if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
        throw new ApiError(400, "Invalid inspection ID.");
      }

      const inspection = await Inspection.findById(
        inspectionId
      ).session(session);

      if (!inspection) {
        throw new ApiError(404, "Inspection not found.");
      }

      if (inspection.status !== "completed") {
        throw new ApiError(
          400,
          `Inspection can only be approved or rejected after it is completed. Current status is "${inspection.status}".`
        );
      }

      if (!["approved", "rejected"].includes(status)) {
        throw new ApiError(
          400,
          "Inspection can only be approved or rejected."
        );
      }

      if (status === "rejected" && !reason) {
        throw new ApiError(
          400,
          "Rejection reason is required when rejecting an inspection."
        );
      }

      const device = await Device.findById(
        inspection.device
      ).session(session);

      if (!device) {
        throw new ApiError(404, "Device not found.");
      }

      const order = await Order.findById(
        inspection.order
      ).session(session);

      if (!order) {
        throw new ApiError(404, "Related order not found.");
      }

      if (
        !order.device ||
        order.device.toString() !== inspection.device.toString()
      ) {
        throw new ApiError(
          400,
          "Inspection, order and device relationship is invalid."
        );
      }

      const now = new Date();

      /*
       * APPROVE INSPECTION
       */
      if (status === "approved") {
        const sellingPrice = Number(inspection.sellingPrice);

        if (
          inspection.sellingPrice === undefined ||
          inspection.sellingPrice === null ||
          inspection.sellingPrice === "" ||
          !Number.isFinite(sellingPrice) ||
          sellingPrice <= 0
        ) {
          throw new ApiError(
            400,
            "A valid selling price is required before approving the inspection."
          );
        }

        let inventory;

        if (order.inventory?.inventoryId) {
          // Update the existing inventory record.
          inventory = await Inventory.findById(
            order.inventory.inventoryId
          ).session(session);

          if (!inventory) {
            throw new ApiError(
              404,
              "The linked inventory record was not found."
            );
          }

          inventory.listedPrice = sellingPrice;
          inventory.updatedBy = userId;

          await inventory.save({ session });
        } else {
          // Create inventory with the inspection selling price.
          inventory = await inventoryService.createInventory(
            {
              orderId: order._id.toString(),
              listedPrice: sellingPrice,
            },
            userId,
            session
          );

          order.inventory.inventoryId = inventory._id;
        }

        // Keep the device selling price synchronized.
        device.expectedSellingPrice = sellingPrice;

        // Update order inventory information.
        order.inventory.status = "in_inventory";
        order.inventory.listedPrice = sellingPrice;

        device.status = "inventory";
        device.updatedBy = userId;
      }

      /*
       * REJECT INSPECTION
       */
      if (status === "rejected") {
        device.status = "rejected";
        device.updatedBy = userId;
      }

      await device.save({ session });

      /*
       * UPDATE INSPECTION STATUS
       */
      inspection.status = status;
      inspection.updatedBy = userId;

      if (status === "approved") {
        inspection.approvedAt = now;
      }

      if (status === "rejected") {
        inspection.rejectionReason =
          reason || "Device rejected after inspection.";
      }

      await inspection.save({ session });

      /*
       * UPDATE ORDER
       */
      order.updatedBy = userId;

      if (status === "approved") {
        order.status = "ready_stock";

        order.inspection.status = "approved";
        order.inspection.inspectedBy = inspection.inspectionAgent;
        order.inspection.inspectedAt = inspection.completedAt;
        order.inspection.condition = inspection.bodyCondition;
        order.inspection.grade = inspection.overallGrade;
        order.inspection.physicalCondition = inspection.bodyCondition;
        order.inspection.screenCondition = inspection.screenCondition;
        order.inspection.batteryHealth = inspection.batteryHealth;
        order.inspection.functionalIssues = [];
        order.inspection.inspectionNotes = inspection.remarks;
        order.inspection.approvedAt = now;

        order.timeline.push({
          status: "inspection_completed",
          message:
            "Device inspection completed and approved. Device is ready for stock.",
          performedBy: userId,
        });
      }

      if (status === "rejected") {
        order.status = "rejected";

        order.inspection.status = "rejected";
        order.inspection.inspectedBy = inspection.inspectionAgent;
        order.inspection.inspectedAt = inspection.completedAt;
        order.inspection.rejectionReason = inspection.rejectionReason;

        order.timeline.push({
          status: "rejected",
          message:
            inspection.rejectionReason ||
            "Device rejected after inspection.",
          performedBy: userId,
        });
      }

      await order.save({ session });

      updatedInspection = inspection._id;
    });

    return populateInspection(
      Inspection.findById(updatedInspection)
    );
  } finally {
    await session.endSession();
  }
};


export const deleteInspection = async (
  inspectionId
) => {
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
    );

  if (!inspection) {
    throw new ApiError(
      404,
      "Inspection not found."
    );
  }

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

  await inspection.deleteOne();
};