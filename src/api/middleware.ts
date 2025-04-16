import { Request, Response, NextFunction } from "express";
import { loggerHttp } from "../logger";

const middleware = {
    logger: function (req: Request, res: Response, next: NextFunction) {
        loggerHttp(req, res);
        next();
    }
}

export default middleware;