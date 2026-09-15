import ApiError from "../../utils/errors/ApiError.js";

import settingRepository from "./setting.repository.js";

class SettingService {
  async getSettings(userId) {
    const user = await settingRepository.findUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return this.formatSettings(user);
  }

  async updateSettings(userId, updateData) {
    const user = await settingRepository.findUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const updatedUser = await settingRepository.updateUserById(
      userId,
      updateData
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found.");
    }

    return this.formatSettings(updatedUser);
  }

  formatSettings(user) {
    const data = {
      id: user._id,
      fullName: user.fullName || "",
      phone: user.phone || "",
      countryCode: user.countryCode || "+91",
      email: user.email || "",
      profileImage: user.profileImage || "",
      role: user.role,
      status: user.status,
      loginProvider: user.loginProvider || "phone",
      isPhoneVerified: user.isPhoneVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (user.role === "agent") {
      data.agentProfile = {
        agentId: user.agentProfile?.agentId || "",
        experience: user.agentProfile?.experience || 0,
        alternatePhone: user.agentProfile?.alternatePhone || "",
        workingHours: {
          start: user.agentProfile?.workingHours?.start || "",
          end: user.agentProfile?.workingHours?.end || "",
        },
        address: {
          line1: user.agentProfile?.address?.line1 || "",
          city: user.agentProfile?.address?.city || "",
          state: user.agentProfile?.address?.state || "",
          pinCode: user.agentProfile?.address?.pinCode || "",
        },
        operatingArea: user.agentProfile?.operatingArea || "",
        onboardingDate: user.agentProfile?.onboardingDate || null,
        coverage: {
          primaryArea:
            user.agentProfile?.coverage?.primaryArea || "",
          areasCovered:
            user.agentProfile?.coverage?.areasCovered || [],
        },
      };
    }

    return data;
  }
}

export default new SettingService();