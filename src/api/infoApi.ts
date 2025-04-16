import { Express, Request, Response } from 'express';
import PhotoService from '../service/photoService';
import logger from 'pino-http';

const infoApi = (app: Express, photoService: PhotoService) => {
    app.get('/info', async (req: Request, res: Response) => {
        logger()(req,res);
        const photo_id = req.query.photo_id as string;
        req.log.info('ID', photo_id)
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getPhotoInfo(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/photoComments', async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        console.log('ID', photo_id)
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getPhotoComments(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getAllContexts', async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        console.log('ID', photo_id)
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getAllContexts(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicPhotos', async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await photoService.getPublicPhotos(user_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicGroups', async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await photoService.getPublicGroups(user_id);
        res.send(JSON.stringify(info));
    })

    app.get('/suggestActions', async (req: Request, res: Response) => {
        logger()(req,res);
        req.log.info('Suggestions')
        const familyGroups = req.query.fg && (req.query.fg as string).split(',');
        const photos_id = req.query.photos_id && (req.query.photos_id as string).split(',');
        const info = await photoService.suggestActions({familyGroups, photos_id});
        res.send(JSON.stringify(info));
    });
} 

export default infoApi;
