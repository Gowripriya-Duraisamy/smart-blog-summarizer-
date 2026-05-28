import { NextFunction, Request, Response } from "express";
import { verifyAppToken } from "../service/auth.service";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.header("authorization") || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const payload = verifyAppToken(token);

  if (!payload) {
    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }

  (req as AuthenticatedRequest).user = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };

  next();
};
