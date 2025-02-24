import { Router } from "express";
import { ExpressError } from "../lib/express-error.js";

const notFoundRouter = Router();
export const notFoundPlugin = notFoundRouter.all("/*all", (_req, _res) => {
  throw new ExpressError(404, "Not found");
});
