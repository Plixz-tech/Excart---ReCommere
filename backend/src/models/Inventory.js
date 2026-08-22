import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true,
            index: true,
        },

        device: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true,
            unique: true,
            index: true,
        },

        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inspection",
            required: true,
            unique: true,
            index: true,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        listedPrice: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        soldPrice: {
            type: Number,
            min: 0,
            default: 0,
        },

        status: {
            type: String,
            enum: [
                "draft",
                "listed",
                "sold",
                "removed",
            ],
            default: "draft",
            index: true,
        },

        listedAt: {
            type: Date,
            default: null,
        },

        soldAt: {
            type: Date,
            default: null,
        },

        soldTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "Inventory",
    inventorySchema
);