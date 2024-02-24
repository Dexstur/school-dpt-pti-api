import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";
import { store } from "../app";

export const auth0 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let activeSession = false;
    const sessionData = new Promise<void>((resolve, reject) => {
      store.get(req.session.id, (err, session) => {
        if (err) {
          console.error(err);
          console.error("Error getting session data");
          resolve();
        } else {
          const currentSession = session as Session;
          if (currentSession) {
            activeSession = true;
          }

          // req.session = session as Session;
          resolve();
        }
      });
    });

    await sessionData;

    if (!req.session.user && !activeSession) {
      return res.status(401).json({
        message: "No Session",
        error: "Unauthorised",
      });
    }
    next();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const auth1 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let authSession = false;
    const sessionData = new Promise<void>((resolve, reject) => {
      store.get(req.session.id, (err, session) => {
        if (err) {
          console.error(err);
          console.error("Error getting session data");
          resolve();
        } else {
          const currentSession = session as Session;
          if (currentSession && currentSession.user) {
            authSession = currentSession.user.authority < 1 ? false : true;
          }

          // req.session = session as Session;
          resolve();
        }
      });
    });

    await sessionData;

    if (!req.session.user && !authSession) {
      return res.status(401).json({
        message: "No Session",
        error: "Unauthorised",
      });
    }
    next();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const auth2 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let authSession = false;
    const sessionData = new Promise<void>((resolve, reject) => {
      store.get(req.session.id, (err, session) => {
        if (err) {
          console.error(err);
          console.error("Error getting session data");
          resolve();
        } else {
          const currentSession = session as Session;
          if (currentSession && currentSession.user) {
            authSession = currentSession.user.authority < 2 ? false : true;
          }

          resolve();
        }
      });
    });

    await sessionData;

    if (!req.session.user && !authSession) {
      return res.status(401).json({
        message: "No Session",
        error: "Unauthorised",
      });
    }
    next();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
