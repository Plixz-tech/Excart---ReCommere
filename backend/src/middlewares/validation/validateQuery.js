import { ZodError } from "zod";
import ApiError from "../../utils/errors/ApiError.js";

const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData =
        await schema.parseAsync(req.query);

      req.query = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(
            400,
            error.issues[0]?.message ||
              "Invalid query parameters."
          )
        );
      }

      next(error);
    }
  };
};

export default validateQuery;