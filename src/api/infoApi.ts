import {Express, Request, Response} from 'express';
import { getPhotoInfo, getPhotoComments, getAllContexts, suggestActions, getPublicPhotos, getPublicGroups } from '../service/photoService';

const infoApi = (app: Express) => {
    app.get('/info', async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        console.log('ID', photo_id)
        if(!photo_id) {
            res.status(500).send('Ups')
        }
        const info = await getPhotoInfo(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/photoComments', async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        console.log('ID', photo_id)
        if(!photo_id) {
            res.status(500).send('Ups')
        }
        const info = await getPhotoComments(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getAllContexts', async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        console.log('ID', photo_id)
        if(!photo_id) {
            res.status(500).send('Ups')
        }
        const info = await getAllContexts(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicPhotos', async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await getPublicPhotos(user_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicGroups', async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await getPublicGroups(user_id);
        res.send(JSON.stringify(info));
    })

    app.get('/suggestActions', async (req: Request, res: Response) => {
        const info = await suggestActions();
        res.send(JSON.stringify(info));
    });
} 


export default infoApi;
