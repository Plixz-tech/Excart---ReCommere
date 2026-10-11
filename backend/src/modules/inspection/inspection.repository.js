import mongoose from "mongoose";

import Inspection from "../../models/Inspection.js";
import Order from "../../models/Order.js";
import Device from "../../models/Device.js";

import ApiError from "../../utils/errors/ApiError.js";
import { getPagination } from "../../utils/pagination/paginate.js";
import inventoryService from "../inventory/inventory.service.js";

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
      `Inspection cannot be edited because its current status is "${inspection.status}".`
    );
  }

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

  // IMEI verification is kept for future use.
  // It is not required to complete inspection.
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

  inspection.updatedBy =
    userId;

  await inspection.save();

  return populateInspection(
    Inspection.findById(
      inspectionId
    )
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
        ).session(session);

      if (!inspection) {
        throw new ApiError(
          404,
          "Inspection not found."
        );
      }

      if (
        inspection.status !==
        "completed"
      ) {
        throw new ApiError(
          400,
          `Inspection can only be approved or rejected after it is completed. Current status is "${inspection.status}".`
        );
      }

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

      if (
        status === "rejected" &&
        !reason
      ) {
        throw new ApiError(
          400,
          "Rejection reason is required when rejecting an inspection."
        );
      }

      const device =
        await Device.findById(
          inspection.device
        ).session(session);

      if (!device) {
        throw new ApiError(
          404,
          "Device not found."
        );
      }

      const order =
        await Order.findById(
          inspection.order
        ).session(session);

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

      const now = new Date();

      /*
       * APPROVE INSPECTION
       */
      if (status === "approved") {
        /*
         * Create inventory only if an inventory
         * record does not already exist.
         */
        if (
          !order.inventory ||
          !order.inventory.inventoryId
        ) {
          const inventory =
            await inventoryService.createInventory(
              {
                orderId:
                  order._id.toString(),

                listedPrice: 0,
              },
              userId,
              session
            );

          order.inventory.inventoryId =
            inventory._id;
        }

        /*
         * Update device status
         */
        device.status =
          "inventory";

        device.updatedBy =
          userId;

        /*
         * Update order inventory information
         */
        order.inventory.status =
          "in_inventory";

        order.inventory.listedPrice =
          0;
      }

      /*
       * REJECT INSPECTION
       */
      if (status === "rejected") {
        device.status =
          "rejected";

        device.updatedBy =
          userId;
      }

      /*
       * Save device changes
       */
      await device.save({
        session,
      });

      /*
       * Update inspection status
       */
      inspection.status =
        status;

      inspection.updatedBy =
        userId;

      if (status === "approved") {
        inspection.approvedAt =
          now;
      }

      if (status === "rejected") {
        inspection.rejectionReason =
          reason ||
          "Device rejected after inspection.";
      }

      /*
       * Save inspection changes
       */
      await inspection.save({
        session,
      });

      /*
       * Update order
       */
      order.updatedBy =
        userId;

      /*
       * APPROVED
       */
      if (status === "approved") {
        order.status =
          "ready_stock";

        order.inspection.status =
          "approved";

        order.inspection.inspectedBy =
          inspection.inspectionAgent;

        order.inspection.inspectedAt =
          inspection.completedAt;

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

        order.timeline.push({
          status:
            "inspection_completed",

          message:
            "Device inspection completed and approved. Device is ready for stock.",

          performedBy:
            userId,
        });
      }

      /*
       * REJECTED
       */
      if (status === "rejected") {
        order.status =
          "rejected";

        order.inspection.status =
          "rejected";

        order.inspection.inspectedBy =
          inspection.inspectionAgent;

        order.inspection.inspectedAt =
          inspection.completedAt;

        order.inspection.rejectionReason =
          inspection.rejectionReason;

        order.timeline.push({
          status: "rejected",

          message:
            inspection.rejectionReason ||
            "Device rejected after inspection.",

          performedBy:
            userId,
        });
      }

      /*
       * Save order
       */
      await order.save({
        session,
      });

      /*
       * Store updated inspection
       * for returning after transaction.
       */
      updatedInspection =
        inspection._id;
    });

    /*
     * Transaction completed successfully.
     * Fetch the final inspection after commit.
     */
    return populateInspection(
      Inspection.findById(
        updatedInspection
      )
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