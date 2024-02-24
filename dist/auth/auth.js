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
exports.auth2 = exports.auth1 = exports.auth0 = void 0;
const app_1 = require("../app");
const auth0 = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let activeSession = false;
        const sessionData = new Promise((resolve, reject) => {
            app_1.store.get(req.session.id, (err, session) => {
                if (err) {
                    console.error(err);
                    console.error("Error getting session data");
                    resolve();
                }
                else {
                    const currentSession = session;
                    if (currentSession) {
                        activeSession = true;
                    }
                    // req.session = session as Session;
                    resolve();
                }
            });
        });
        yield sessionData;
        if (!req.session.user && !activeSession) {
            return res.status(401).json({
                message: "No Session",
                error: "Unauthorised",
            });
        }
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.auth0 = auth0;
const auth1 = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let authSession = false;
        const sessionData = new Promise((resolve, reject) => {
            app_1.store.get(req.session.id, (err, session) => {
                if (err) {
                    console.error(err);
                    console.error("Error getting session data");
                    resolve();
                }
                else {
                    const currentSession = session;
                    if (currentSession && currentSession.user) {
                        authSession = currentSession.user.authority < 1 ? false : true;
                    }
                    // req.session = session as Session;
                    resolve();
                }
            });
        });
        yield sessionData;
        if (!req.session.user && !authSession) {
            return res.status(401).json({
                message: "No Session",
                error: "Unauthorised",
            });
        }
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.auth1 = auth1;
const auth2 = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let authSession = false;
        const sessionData = new Promise((resolve, reject) => {
            app_1.store.get(req.session.id, (err, session) => {
                if (err) {
                    console.error(err);
                    console.error("Error getting session data");
                    resolve();
                }
                else {
                    const currentSession = session;
                    if (currentSession && currentSession.user) {
                        authSession = currentSession.user.authority < 2 ? false : true;
                    }
                    resolve();
                }
            });
        });
        yield sessionData;
        if (!req.session.user && !authSession) {
            return res.status(401).json({
                message: "No Session",
                error: "Unauthorised",
            });
        }
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.auth2 = auth2;
