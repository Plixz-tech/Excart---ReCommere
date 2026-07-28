import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    countryCode: {
      type: String,
      default: "+91",
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

email: {
  type: String,
  trim: true,
  lowercase: true,
  unique: true,
  sparse: true,
  default: "",
},
password: {
  type: String,
  select: false,
},

    profileImage: {
      type: String,
      default: "",
    },

loginProvider: {
  type: String,
  enum: ["phone", "email", "google", "facebook"],
  default: "phone",
},

    googleId: {
      type: String,
      default: "",
    },

    facebookId: {
      type: String,
      default: "",
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "blocked", "deleted"],
      default: "active",
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);