import { Request } from "express";
import { store } from "../app";
import { Session } from "express-session";

export const authUser = async (req: Request) => {
  try {
    let userDetails = req.session.user;
    if (userDetails) {
      return userDetails;
    } else {
      const exec = new Promise<void>((resolve, reject) => {
        store.get(req.session.id, (err, session) => {
          if (err) {
            resolve();
          } else {
            const currentSession = session as Session;
            if (!currentSession) {
              resolve();
            } else {
              userDetails = currentSession.user;
              resolve();
            }
          }
        });
      });
      await exec;
      return userDetails;
    }
  } catch {
    console.error("Error fetching user data");
    return null;
  }
};
