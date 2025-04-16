import { Express, Request, Response } from 'express';
import PhotoService from '../service/photoService';
import middleware from './middleware';

const infoApi = (app: Express, photoService: PhotoService) => {

    app.get('/info', middleware.logger, async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getPhotoInfo(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/photoComments', middleware.logger, async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getPhotoComments(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getAllContexts', middleware.logger, async (req: Request, res: Response) => {
        const photo_id = req.query.photo_id as string;
        if(!photo_id) {
            res.status(400).json({ error: 'Missing photo_id' });
        }
        const info = await photoService.getAllContexts(photo_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicPhotos', middleware.logger, async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await photoService.getPublicPhotos(user_id);
        res.send(JSON.stringify(info));
    });

    app.get('/getPublicGroups', middleware.logger, async (req: Request, res: Response) => {
        const user_id = req.query.user_id as string;
        const info = await photoService.getPublicGroups(user_id);
        res.send(JSON.stringify(info));
    })

    app.get('/suggestActions',middleware.logger,  async (req: Request, res: Response) => {
        const familyGroups = req.query.fg && (req.query.fg as string).split(',');
        const photos_id = req.query.photos_id && (req.query.photos_id as string).split(',');
        const info = await photoService.suggestActions({familyGroups, photos_id});
        res.send(JSON.stringify(info));
    });
} 

export default infoApi;
