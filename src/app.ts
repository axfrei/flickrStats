import express, {Express, Request, Response} from 'express';
import infoApi from './api/infoApi';
const app: Express = express();
const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

infoApi(app);

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});