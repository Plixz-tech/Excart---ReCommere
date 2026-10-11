import { verifyAccessToken } from "../../lib/jwt.js";
import { findUserById } from "../../modules/auth/auth.repository.js";
import ApiError from "../../utils/errors/ApiError.js";
import asyncHandler from "../../utils/api/asyncHandler.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized. Access token is missing.");
  }

  // Verify JWT
  const decoded = verifyAccessToken(token);

  // Find user
  const user = await findUserById(decoded.userId);

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

 if (
  user.status === "blocked" ||
  user.status === "deleted"
) {
  const error = new Error(
    user.status === "deleted"
      ? "This account is no longer available."
      : "Your account has been blocked. Please contact support."
  );

  error.statusCode = 403;

  throw error;
}

  // Attach user to request
req.user = {
  userId: user._id,
  role: user.role,
  phone: user.phone,
  email: user.email,
};

  next();
});

export default protect;