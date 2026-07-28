import ApiError from "../../utils/errors/ApiError.js";

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new ApiError(401, "Authentication required.")
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You are not authorized to access this resource."
        )
      );
    }

    next();
  };
};

export default authorize;