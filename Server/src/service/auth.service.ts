import crypto from "crypto";
import { UserModel } from "../models/user.model";

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
  picture?: string;
  aud: string;
}

export interface AppTokenPayload {
  userId: string;
  email: string;
  name: string;
  picture?: string;
  exp: number;
}

const getSecret = () => process.env.APP_JWT_SECRET || "dev-auth-secret";

const base64UrlEncode = (value: string | Buffer) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) => {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
};

const sign = (value: string) =>
  base64UrlEncode(
    crypto.createHmac("sha256", getSecret()).update(value).digest(),
  );

export const createAppToken = (payload: Omit<AppTokenPayload, "exp">) => {
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  );
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    }),
  );
  const unsignedToken = `${header}.${body}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
};

export const verifyAppToken = (token: string): AppTokenPayload | null => {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const unsignedToken = `${header}.${body}`;
  const expectedSignature = sign(unsignedToken);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    )
  ) {
    return null;
  }

  const payload = JSON.parse(base64UrlDecode(body).toString()) as AppTokenPayload;

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
};

export const signInWithGoogle = async (credential: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured in the server .env file",
    );
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      credential,
    )}`,
  );

  if (!response.ok) {
    throw new Error("Invalid Google credential");
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;

  if (tokenInfo.aud !== clientId) {
    throw new Error("Google credential is not for this application");
  }

  if (tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true") {
    throw new Error("Google email is not verified");
  }

  const user = await UserModel.findOneAndUpdate(
    { googleId: tokenInfo.sub },
    {
      $set: {
        email: tokenInfo.email,
        name: tokenInfo.name || tokenInfo.email,
        picture: tokenInfo.picture || "",
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  const appUser = {
    userId: String(user._id),
    email: user.email,
    name: user.name,
    picture: user.picture,
  };

  return {
    token: createAppToken(appUser),
    user: appUser,
  };
};
