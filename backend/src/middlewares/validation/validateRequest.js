import { ZodError } from "zod";
import ApiError from "../../utils/errors/ApiError.js";

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      req.body = validatedData.body;
      req.params = validatedData.params ?? req.params;
      req.query = validatedData.query ?? req.query;

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