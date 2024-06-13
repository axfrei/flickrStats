import express, {Express} from 'express';
import https from 'node:https';
import infoApi from './api/infoApi';
import oauthApi from './api/oauthApi';
import fs from 'node:fs';
import * as dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = 3000;



const options = {
  key: fs.readFileSync( './flickrStats+4-key.pem' ),
  cert: fs.readFileSync( './flickrStats+4.pem' )
}

const server = https.createServer(options, app).listen(port, function(){
  console.log("Express server listening on port " + port);
});

app.get('/test', function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
});

oauthApi(app);

infoApi(app);