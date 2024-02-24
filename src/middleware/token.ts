import { Request, Response, NextFunction } from "express";
import { verifyKey } from "../utils/jwt";

async function handleToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      req.user = undefined;
      next();
      return;
    }
    const id = verifyKey(token);
    if (!id) {
      req.user = undefined;
    } else {
      req.user = id;
    }

    next();
  } catch {
    req.user = undefined;
    next();
  }
}

export default handleToken;
