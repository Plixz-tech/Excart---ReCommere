import User from "../../models/User.js";

class SettingRepository {
  async findUserById(userId) {
    return User.findById(userId).select(
      "-password -googleId -facebookId"
    );
  }

  async updateUserById(userId, updateData) {
    return User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -googleId -facebookId");
  }
}

export default new SettingRepository();