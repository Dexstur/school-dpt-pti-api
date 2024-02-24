"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authUser = void 0;
const app_1 = require("../app");
const authUser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let userDetails = req.session.user;
        if (userDetails) {
            return userDetails;
        }
        else {
            const exec = new Promise((resolve, reject) => {
                app_1.store.get(req.session.id, (err, session) => {
                    if (err) {
                        resolve();
                    }
                    else {
                        const currentSession = session;
                        if (!currentSession) {
                            resolve();
                        }
                        else {
                            userDetails = currentSession.user;
                            resolve();
                        }
                    }
                });
            });
            yield exec;
            return userDetails;
        }
    }
    catch (_a) {
        console.error("Error fetching user data");
        return null;
    }
});
exports.authUser = authUser;
