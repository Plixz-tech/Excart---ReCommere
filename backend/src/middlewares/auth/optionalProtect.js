
import protect from "./protect.js";

const optionalProtect = (req, res, next) => {
  const authorization = req.headers.authorization;

  // Continue as a guest when no Bearer token is provided.
  if (!authorization) {
    return next();
  }

  // Authenticate requests that provide an access token.
  return protect(req, res, next);
};

export default optionalProtect;
