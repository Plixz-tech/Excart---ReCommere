import { ZodError } from "zod";
import ApiError from "../../utils/errors/ApiError.js";

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync(req.body);

      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(
            400,
            error.issues[0]?.message || "Validation failed."
          )
        );
      }

      next(error);
    }
  };
};

export default validateRequest;