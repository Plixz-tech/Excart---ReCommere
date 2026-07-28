import mongoose from "mongoose";
import bcrypt from "bcrypt";

import User from "../models/User.js";
import { env } from "../config/env/index.js";

const createAdmin = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);

    const existingAdmin = await User.findOne({
      email: "admin@excart.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      fullName: "Super Admin",
      email: "admin@excart.app",
      password: hashedPassword,
      role: "admin",
      loginProvider: "email",
      status: "active",
    });

    console.log("Admin created successfully.");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();