import cors from 'cors';
import * as dotenv from "dotenv";
import express, { Express } from 'express';
import fs from 'node:fs';
import https from 'node:https';
import infoApi from './api/infoApi';
import oauthApi from './api/oauthApi';
import { connectToDb } from './repository/db';
import { AppContainer } from './app/container';
import loggerHttp, {HttpLogger} from 'pino-http';
import logger, {Logger} from 'pino';

dotenv.config();

const app: Express = express();
const photoService = AppContainer.getPhotoService();
const port = process.env.PORT || 3000;
const loggerHttp_:HttpLogger = loggerHttp();
const logger_: Logger = logger();

const start = async () => {
  try {

    await connectToDb();

    app.use(cors());
    app.use(loggerHttp_);

    if (process.env.STAGE === 'LOCAL') {
      const options = {
        key: fs.readFileSync('./localhost+2-key.pem'),
        cert: fs.readFileSync('./localhost+2.pem')
      }

      const server = https.createServer(options, app).listen(port, function () {
        logger_.info("Express server listening on port " + port);
      });
    } else {
      app.listen(port, () => {
        logger_.info(`Express server listening on port ${port}`)
      })
    }

    oauthApi(app);

    infoApi(app, photoService);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();