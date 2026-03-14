import { requireRole } from "./role.middleware";

export const authMiddleware = requireRole(["center_owner", "teacher"]);
