import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

const secretKey = process.env.SESSION_SECRET || "secret";

interface PayloadReturn {
  iat: number;
  exp: number;
}

interface RegKey {
  email: string;
  authority: number;
}

interface RegKeyReturn extends PayloadReturn {
  email: string;
  authority: number;
}

interface KeyReturn extends PayloadReturn {
  key: string;
}

export function generateRegKey(options: RegKey) {
  const token = jwt.sign(options, secretKey, { expiresIn: "24h" });
  const encoded = Buffer.from(token).toString("base64");
  return encoded;
}
export function generateKey(key: string) {
  const token = jwt.sign({ key }, secretKey, { expiresIn: "24h" });
  const encoded = Buffer.from(token).toString("base64");
  return encoded;
}

export function limitedKey(key: string) {
  const token = jwt.sign({ key }, secretKey, { expiresIn: "20m" });
  const encoded = Buffer.from(token).toString("base64");
  return encoded;
}

export const verifyRegKey = (token: string) => {
  try {
    const decrypt = Buffer.from(token, "base64").toString();
    const decoded = jwt.verify(decrypt, secretKey) as RegKeyReturn;
    return decoded;
  } catch {
    return null;
  }
};
export const verifyKey = (token: string) => {
  try {
    const decrypt = Buffer.from(token, "base64").toString();
    const decoded = jwt.verify(decrypt, secretKey) as KeyReturn;
    return decoded.key;
  } catch {
    return null;
  }
};
