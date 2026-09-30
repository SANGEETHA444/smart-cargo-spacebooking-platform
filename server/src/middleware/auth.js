import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export function auth(requiredRoles = []) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).select("-passwordHash");
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: "7d" });
}
