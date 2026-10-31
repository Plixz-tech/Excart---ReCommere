import mongoose from "mongoose";

import DeviceCatalog from "../../models/DeviceCatalog.js";
import ApiError from "../../utils/errors/ApiError.js";

import crypto from "node:crypto";

import orderEvaluationRepository from "./orderEvaluation.repository.js";

import { calculatePrice } from "../pricingRule/pricingRule.service.js";

import orderService from "../order/order.service.js";

import { uploadBufferToCloudinary } from "../../lib/uploadBuffer.js";

import notificationService from "../notification/notification.service.js";
import auditLogger from "../../utils/audit/auditLogger.js";

const EVALUATION_EXPIRY_HOURS = 24;

// VALIDATE CUSTOMER EVALUATION ANSWERS
const validateEvaluationAnswers = (
    customerEvaluation,
    evaluationConfig
) => {
    const allowedFields = {
        screenCondition: "single",
        displayIssues: "multiple",
        bodyCondition: "single",
        batteryHealth: "single",
        repairHistory: "single",
        accessories: "multiple",
        functionalChecks: "functional",
        functionalTests: "functional",
    };

    for (const [field, value] of Object.entries(
        customerEvaluation
    )) {
        const fieldType = allowedFields[field];

        if (!fieldType) {
            throw new ApiError(
                400,
                `Unsupported evaluation field: ${field}.`
            );
        }

        const configField =
            field === "functionalTests"
                ? evaluationConfig?.functionalChecks
                : evaluationConfig?.[field];

        if (!configField?.enabled) {
            throw new ApiError(
                400,
                `Evaluation field '${field}' is disabled.`
            );
        }

        if (fieldType === "functional") {
            if (
                !value ||
                typeof value !== "object" ||
                Array.isArray(value)
            ) {
                throw new ApiError(
                    400,
                    `Field '${field}' must be an object of Boolean answers.`
                );
            }

            const allowedChecks = configField.options || [];

            for (const [check, answer] of Object.entries(value)) {
                if (
                    !allowedChecks.some(
                        (option) =>
                            option.toLowerCase() ===
                            check.toLowerCase()
                    )
                ) {
                    throw new ApiError(
                        400,
                        `Unsupported functional check: ${check}.`
                    );
                }

                if (typeof answer !== "boolean") {
                    throw new ApiError(
                        400,
                        `Functional check '${check}' must be true or false.`
                    );
                }
            }

            continue;
        }

        const options = configField.options || [];

        if (fieldType === "multiple") {
            if (!Array.isArray(value)) {
                throw new ApiError(
                    400,
                    `Field '${field}' must be an array.`
                );
            }

            if (
                configField.allowMultiple === false &&
                value.length > 1
            ) {
                throw new ApiError(
                    400,
                    `Field '${field}' allows only one answer.`
                );
            }

            const invalidOption = value.find(
                (answer) =>
                    typeof answer !== "string" ||
                    !options.includes(answer)
            );

            if (invalidOption !== undefined) {
                throw new ApiError(
                    400,
                    `Invalid option for '${field}'.`
                );
            }

            continue;
        }

        if (
            typeof value !== "string" ||
            !options.includes(value)
        ) {
            throw new ApiError(
                400,
                `Invalid option for '${field}'.`
            );
        }
    }
};

// CREATE EVALUATION SESSION


export const createEvaluation = async (
    deviceCatalogId,
    customerId = null
) => {
    if (!mongoose.Types.ObjectId.isValid(deviceCatalogId)) {
        throw new ApiError(400, "Invalid device catalog ID.");
    }

    if (
        customerId &&
        !mongoose.Types.ObjectId.isValid(customerId)
    ) {
        throw new ApiError(401, "Invalid customer.");
    }

    const catalogDevice = await DeviceCatalog.findOne({
        _id: deviceCatalogId,
        active: true,
    });

    if (!catalogDevice) {
        throw new ApiError(404, "Device catalog item not found.");
    }

    const expiresAt = new Date(
        Date.now() + EVALUATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    // Generate a guest token only for unauthenticated customers.
    const guestToken = customerId
        ? null
        : generateGuestToken();

    const evaluationData = {
        customer: customerId || null,
        deviceCatalogId,
        customerEvaluation: {},
        photos: [],
        pricing: null,
        status: "draft",
        expiresAt,
    };

    if (guestToken) {
        evaluationData.guestTokenHash =
            hashGuestToken(guestToken);
    }

    const evaluation =
        await orderEvaluationRepository.create(evaluationData);

    // Convert the evaluation document into a plain object.
    const result = evaluation.toObject();

    // Never expose the stored guest token hash in the API response.
    delete result.guestTokenHash;

    // Return the raw guest token only when creating a guest evaluation.
    if (guestToken) {
        result.guestToken = guestToken;
    }

    return result;
};


const verifyGuestToken = (token, storedHash) => {
    if (
        typeof token !== "string" ||
        !/^[a-f0-9]{64}$/i.test(token) ||
        typeof storedHash !== "string"
    ) {
        return false;
    }

    const tokenHash = hashGuestToken(token);

    return crypto.timingSafeEqual(
        Buffer.from(tokenHash, "hex"),
        Buffer.from(storedHash, "hex")
    );
};


const authorizeEvaluationAccess = (
    evaluation,
    customerId,
    guestToken
) => {
    if (customerId) {
        if (
            evaluation.customer &&
            evaluation.customer.toString() ===
            customerId.toString()
        ) {
            return true;
        }

        throw new ApiError(
            403,
            "You are not authorized to access this evaluation."
        );
    }

    if (
        !verifyGuestToken(
            guestToken,
            evaluation.guestTokenHash
        )
    ) {
        throw new ApiError(
            403,
            "Invalid guest evaluation token."
        );
    }

    return true;
};


// GET CUSTOMER EVALUATION


export const getEvaluation = async (
    evaluationId,
    customerId = null,
    guestToken = null
) => {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new ApiError(400, "Invalid evaluation ID.");
    }

    const evaluation =
        await orderEvaluationRepository.findById(
            evaluationId
        );

    if (!evaluation) {
        throw new ApiError(404, "Evaluation not found.");
    }

    // Verify that the customer owns this evaluation.
    authorizeEvaluationAccess(
        evaluation,
        customerId,
        guestToken
    );

    // Reject expired evaluations unless already confirmed.
    if (
        evaluation.expiresAt &&
        evaluation.expiresAt < new Date() &&
        evaluation.status !== "confirmed"
    ) {
        throw new ApiError(
            410,
            "This evaluation has expired. Please start again."
        );
    }

    // Remove the internal guest token hash from the API response.
    const result = evaluation.toObject();

    delete result.guestTokenHash;

    return result;
};



// GENERATE A SECURE GUEST TOKEN
const generateGuestToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// HASH GUEST TOKEN BEFORE STORING IT
const hashGuestToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// SAVE CUSTOMER EVALUATION ANSWERS


export const saveEvaluationAnswers = async (
    evaluationId,
    customerId,
    customerEvaluation,
    guestToken = null
) => {
    // Verify evaluation ownership and expiry.
    const evaluation = await getEvaluation(
        evaluationId,
        customerId,
        guestToken
    );

    if (
        evaluation.status === "confirmed" ||
        evaluation.status === "expired"
    ) {
        throw new ApiError(
            400,
            "This evaluation can no longer be modified."
        );
    }

    if (
        !customerEvaluation ||
        typeof customerEvaluation !== "object" ||
        Array.isArray(customerEvaluation)
    ) {
        throw new ApiError(
            400,
            "Valid evaluation answers are required."
        );
    }

    const catalogDevice = await DeviceCatalog.findOne({
        _id: evaluation.deviceCatalogId,
        active: true,
    });

    if (!catalogDevice) {
        throw new ApiError(
            404,
            "Device catalog item not found."
        );
    }

    // Validate answers against the device's evaluation configuration.
    validateEvaluationAnswers(
        customerEvaluation,
        catalogDevice.evaluationConfig
    );

    const updatedEvaluation =
        await orderEvaluationRepository.updateById(
            evaluationId,
            {
                customerEvaluation,
                pricing: null,
                status: "draft",
            }
        );

    if (!updatedEvaluation) {
        throw new ApiError(
            404,
            "Evaluation not found."
        );
    }

    // Never expose the internal guest token hash.
    const result = updatedEvaluation.toObject();
    delete result.guestTokenHash;

    return result;
};


// CALCULATE EVALUATION PRICE

export const calculateEvaluationPrice = async (
    evaluationId,
    customerId,
    guestToken = null
) => {
    const evaluation = await getEvaluation(
        evaluationId,
        customerId,
        guestToken
    );

    if (
        typeof evaluation.imei1 !== "string" ||
        !/^\d{15}$/.test(evaluation.imei1.trim())
    ) {
        throw new ApiError(
            400,
            "Please enter a valid 15-digit IMEI before calculating the price."
        );
    }

    if (
        evaluation.status === "confirmed" ||
        evaluation.status === "expired"
    ) {
        throw new ApiError(
            400,
            "Price cannot be calculated for this evaluation."
        );
    }

    const pricingResult = await calculatePrice({
        deviceCatalogId: evaluation.deviceCatalogId.toString(),
        evaluation: evaluation.customerEvaluation,
    });

    return orderEvaluationRepository.updateById(
        evaluationId,
        {
            pricing: pricingResult,
            status: "priced",
        }
    );
};


// SAVE CUSTOMER DEVICE IMEI

export const saveEvaluationImei = async (
    evaluationId,
    customerId,
    imei1,
    guestToken = null
) => {
    const evaluation = await getEvaluation(
        evaluationId,
        customerId,
        guestToken
    );

    if (
        evaluation.status === "confirmed" ||
        evaluation.status === "expired"
    ) {
        throw new ApiError(
            400,
            "This evaluation can no longer be modified."
        );
    }

    if (
        typeof imei1 !== "string" ||
        !/^\d{15}$/.test(imei1.trim())
    ) {
        throw new ApiError(
            400,
            "A valid 15-digit IMEI is required."
        );
    }

    return orderEvaluationRepository.updateById(
        evaluationId,
        {
            imei1: imei1.trim(),
            pricing: null,
            status: "draft",
        }
    );
};


// UPLOAD CUSTOMER DEVICE PHOTOS

export const uploadEvaluationPhotos = async (
    evaluationId,
    customerId,
    files,
    guestToken = null
) => {
    const evaluation = await getEvaluation(
        evaluationId,
        customerId,
        guestToken
    );

    if (
        evaluation.status === "confirmed" ||
        evaluation.status === "expired"
    ) {
        throw new ApiError(
            400,
            "This evaluation can no longer be modified."
        );
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new ApiError(
            400,
            "At least one device photo is required."
        );
    }

    const MAX_PHOTOS = 6;
    const existingPhotos = evaluation.photos || [];

    if (existingPhotos.length + files.length > MAX_PHOTOS) {
        throw new ApiError(
            400,
            `A maximum of ${MAX_PHOTOS} device photos is allowed.`
        );
    }

    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ];

    for (const file of files) {
        if (
            !file ||
            !Buffer.isBuffer(file.buffer) ||
            !allowedMimeTypes.includes(file.mimetype)
        ) {
            throw new ApiError(
                400,
                "Only valid JPG, PNG and WEBP image files are allowed."
            );
        }
    }

    const uploadedPhotos = [];

    for (const file of files) {
        const uploadedFile =
            await uploadBufferToCloudinary(file.buffer, {
                folder: `excart/evaluations/${evaluationId}/photos`,
                resource_type: "image",
            });

        if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
            throw new ApiError(
                502,
                "Photo upload failed. Please try again."
            );
        }

        uploadedPhotos.push({
            url: uploadedFile.secure_url,
            publicId: uploadedFile.public_id,
            uploadedAt: new Date(),
        });
    }

    return orderEvaluationRepository.updateById(
        evaluationId,
        {
            photos: [...existingPhotos, ...uploadedPhotos],
            pricing: null,
            status: "draft",
        }
    );
};


// CONFIRM EVALUATION AND CREATE ORDER

export const confirmEvaluation = async (
    evaluationId,
    customerId,
    pickupDetails
) => {
    if (!customerId) {
        throw new ApiError(
            401,
            "Please log in to confirm your evaluation."
        );
    }

    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new ApiError(400, "Invalid evaluation ID.");
    }

    if (!pickupDetails || typeof pickupDetails !== "object") {
        throw new ApiError(400, "Pickup details are required.");
    }

    const { pickup, notes } = pickupDetails;

    if (!pickup?.scheduledDate || !pickup?.scheduledTime || !pickup?.address) {
        throw new ApiError(
            400,
            "Pickup date, time and address are required."
        );
    }

    const session = await mongoose.startSession();
    let createdOrderId = null;

    try {
        await session.withTransaction(async () => {
            const evaluation = await orderEvaluationRepository.findById(
                evaluationId,
                session
            );

            if (!evaluation) {
                throw new ApiError(404, "Evaluation not found.");
            }

            if (
                !evaluation.customer ||
                evaluation.customer.toString() !== customerId.toString()
            ) {
                throw new ApiError(
                    403,
                    "You are not authorized to confirm this evaluation."
                );
            }

            if (evaluation.status === "confirmed" || evaluation.orderId) {
                throw new ApiError(
                    409,
                    "This evaluation has already been confirmed."
                );
            }

            if (evaluation.status !== "priced" || !evaluation.pricing) {
                throw new ApiError(
                    400,
                    "Please calculate the evaluation price before confirming."
                );
            }

            if (
                evaluation.expiresAt &&
                evaluation.expiresAt <= new Date()
            ) {
                throw new ApiError(
                    410,
                    "This evaluation has expired. Please start a new evaluation."
                );
            }

            if (!/^\d{15}$/.test(evaluation.imei1 || "")) {
                throw new ApiError(
                    400,
                    "A valid 15-digit IMEI is required before confirmation."
                );
            }

            const catalogDevice = await DeviceCatalog.findOne({
                _id: evaluation.deviceCatalogId,
                active: true,
            }).session(session);

            if (!catalogDevice) {
                throw new ApiError(
                    404,
                    "Device catalog item not found or inactive."
                );
            }

            // Derive device details from the trusted catalog, not the client.

            const orderData = {
                deviceCatalogId: catalogDevice._id.toString(),

                // Device details from the catalog
                brand: catalogDevice.brand,
                model: catalogDevice.model,
                storage: catalogDevice.storage,
                ram: catalogDevice.ram,

                // Preserve device details from the evaluation/request
                variant: pickupDetails.variant || "",
                color: pickupDetails.color || "",
                imei1: evaluation.imei1,
                imei2: pickupDetails.imei2 || "",
                serialNumber: pickupDetails.serialNumber || "",

                // Customer evaluation and uploaded photos
                customerAnswers: evaluation.customerEvaluation || {},

                customerEvaluation: {
                    screenCondition: evaluation.customerEvaluation?.screenCondition || "",
                    displayIssues: evaluation.customerEvaluation?.displayIssues || [],
                    bodyCondition: evaluation.customerEvaluation?.bodyCondition || "",
                    batteryHealth: null,

                    repairHistory: {
                        repaired: evaluation.customerEvaluation?.repairHistory === "Repaired",
                        remarks: "",
                    },

                    accessories: {
                        charger: (evaluation.customerEvaluation?.accessories || []).includes("Charger"),
                        cable: (evaluation.customerEvaluation?.accessories || []).includes("Cable"),
                        box: (evaluation.customerEvaluation?.accessories || []).includes("Original box"),
                        bill: (evaluation.customerEvaluation?.accessories || []).includes("Bill/Invoice"),
                        simEjector: (evaluation.customerEvaluation?.accessories || []).includes("SIM ejector"),
                    },

                    functionalIssues: Object.entries(
                        evaluation.customerEvaluation?.functionalChecks || {}
                    )
                        .filter(([, working]) => working === false)
                        .map(([name]) => name),
                },

                photos: (evaluation.photos || []).map((photo) => ({
                    url: photo.url,
                    publicId: photo.publicId || "",
                })),

                // Pickup details
                pickup,
                notes: notes || "",
            };


            // createOrder recalculates pricing on the server.
            const order = await orderService.createOrder(
                orderData,
                customerId,
                {
                    session,
                    skipSideEffects: true,
                    pricingOverride: evaluation.pricing,
                }
            );

            createdOrderId = order._id;

            const confirmedEvaluation =
                await orderEvaluationRepository.confirmIfPriced(
                    evaluationId,
                    customerId,
                    order._id,
                    session
                );

            if (!confirmedEvaluation) {
                throw new ApiError(
                    409,
                    "The evaluation could not be confirmed. Please refresh and try again."
                );
            }
        });

        const order = await orderService.getMyOrderById(
            createdOrderId.toString(),
            customerId
        );

        // Side effects happen only after the transaction commits.
        try {
            const auditLoggerModule = await import("../../utils/audit/auditLogger.js");
            const auditLogger = auditLoggerModule.default;

            await auditLogger({
                actor: customerId,
                action: "ORDER_CREATED",
                module: "order",
                entityType: "Order",
                entityId: order._id,
                description: `Order ${order.orderNumber} was created from an evaluation.`,
                newValue: {
                    status: order.status,
                    orderNumber: order.orderNumber,
                    evaluationId,
                },
            });
        } catch (error) {
            console.error("Failed to create order audit log:", error);
        }

        // Notification after transaction commit
        try {
            await notificationService.createNotification({
                recipient: customerId,
                title: "Order Confirmed",
                message: `Your order ${order.orderNumber} has been created successfully.`,
                type: "order_created",
                order: order._id,
            });
        } catch (error) {
            console.error("Failed to create order notification:", error);
        }

        return {
            evaluationId,
            order,
        };
    } finally {
        await session.endSession();
    }
};
