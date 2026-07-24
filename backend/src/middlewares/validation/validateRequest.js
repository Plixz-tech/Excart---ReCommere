import { ZodError } from "zod";
import ApiError from "../../utils/errors/ApiError.js";

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      console.log("Schema:", schema);
      console.log("Body:", req.body);
      console.log("Headers:", req.headers);
      console.log("Content-Type:", req.get("content-type"));
      req.body = await schema.parseAsync(req.body);
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