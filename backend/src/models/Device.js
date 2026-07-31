import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
    {
        // Device Details
        brand: {
            type: String,
            required: true,
            trim: true,
        },

        model: {
            type: String,
            required: true,
            trim: true,
        },

        variant: {
            type: String,
            default: "",
        },

        color: {
            type: String,
            default: "",
        },

        storage: {
            type: String,
            default: "",
        },

        ram: {
            type: String,
            default: "",
        },

        // Device Identity
        imei1: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        imei2: {
            type: String,
            default: "",
            trim: true,
        },

        serialNumber: {
            type: String,
            default: "",
            trim: true,
        },

        // Pricing
        purchasePrice: {
            type: Number,
            default: 0,
        },

        expectedSellingPrice: {
            type: Number,
            default: 0,
        },

        // Ownership
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        pickupAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        inspectionAgent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Photos
        photos: [
            {
                url: String,
                publicId: String,
                uploadedAt: Date,
            },
        ],

        // Status
        status: {
            type: String,
            enum: [
                "pending_pickup",
                "picked_up",
                "inspection_pending",
                "inspection_completed",
                "approved",
                "rejected",
                "inventory",
                "listed",
                "sold",
                "returned",
                "deleted",
            ],
            default: "pending_pickup",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Device", deviceSchema);