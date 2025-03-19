import cors from 'cors';
import * as dotenv from "dotenv";
import express, { Express } from 'express';
import fs from 'node:fs';
import https from 'node:https';
import infoApi from './api/infoApi';
import oauthApi from './api/oauthApi';
import { connectToDb } from './db';

dotenv.config();


const app: Express = express();
const port = process.env.PORT || 3000;

const start = async () => {
  try {

    await connectToDb();

    app.use(cors());

    if (process.env.STAGE === 'LOCAL') {
      const options = {
        key: fs.readFileSync('./localhost+2-key.pem'),
        cert: fs.readFileSync('./localhost+2.pem')
      }

      const server = https.createServer(options, app).listen(port, function () {
        console.log("Express server listening on port " + port);
      });
    } else {
      app.listen(port, () => {
        console.log(`Express server listening on port ${port}`)
      })
    }

    oauthApi(app);

    infoApi(app);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

start();