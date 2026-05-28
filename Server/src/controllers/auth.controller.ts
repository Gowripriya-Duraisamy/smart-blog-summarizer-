import { Request, Response } from "express";
import { signInWithGoogle } from "../service/auth.service";

export const googleSignIn = async (req: Request, res: Response) => {
  try {
    const credential = req.body?.credential;

    if (!credential || typeof credential !== "string") {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const result = await signInWithGoogle(credential);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({
      message: error.message || "Unable to sign in with Google",
    });
  }
};
