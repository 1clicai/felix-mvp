import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface AccessTokenPayload {
  sub: string;
  tenantId: string;
  role: string;
}

const signOptions: jwt.SignOptions = {
  algorithm: "HS256",
  expiresIn: "12h",
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.SESSION_SECRET, signOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.SESSION_SECRET) as AccessTokenPayload;
}
