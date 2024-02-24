import { Session } from "express-session";
import { Response, Request } from "express";

declare module "express-session" {
  interface Session {
    user?: {
      id: string;
      authority: number;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: string;
    }
  }
}
