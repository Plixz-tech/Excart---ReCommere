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

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked", "deleted"],
      default: "active",
    },

    agentProfile: {
      agentId: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
      },
      experience: {
        type: Number,
        default: 0,
      },

      alternatePhone: {
        type: String,
        default: "",
      },

      aadhaarNumber: {
        type: String,
        default: "",
      },

      aadhaarVerified: {
        type: Boolean,
        default: false,
      },

      panNumber: {
        type: String,
        default: "",
      },

      panVerified: {
        type: Boolean,
        default: false,
      },

      workingHours: {
        start: {
          type: String,
          default: "",
        },
        end: {
          type: String,
          default: "",
        },
      },

      address: {
        line1: {
          type: String,
          default: "",
        },
        city: {
          type: String,
          default: "",
        },
        state: {
          type: String,
          default: "",
        },
        pinCode: {
          type: String,
          default: "",
        },
      },

      operatingArea: {
        type: String,
        default: "",
      },

      onboardingDate: {
        type: Date,
        default: null,
      },

      coverage: {
        primaryArea: {
          type: String,
          default: "",
        },

        areasCovered: {
          type: [String],
          default: [],
        },
      },

 verificationDocuments: {
  aadhaar: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  panCard: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  policeClearance: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  drivingLicense: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  photo: {
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
},
}, 

    lastLogin: {
      type: Date,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);



export default mongoose.model("User", userSchema);