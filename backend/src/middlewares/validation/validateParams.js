import { ZodError } from "zod";
import ApiError from "../../utils/errors/ApiError.js";

const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedParams =
        await schema.parseAsync(req.params);

      req.params = validatedParams;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(
            400,
            error.issues[0]?.message ||
              "Invalid request parameters."
          )
        );
      }

      next(error);
    }
  };
};

export default validateParams;