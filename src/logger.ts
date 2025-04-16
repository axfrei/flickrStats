import pino, { Logger } from 'pino';
import pinoHttp, { HttpLogger } from 'pino-http';

export const logger: Logger = pino();
export const loggerHttp:HttpLogger = pinoHttp();