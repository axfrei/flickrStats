import { NodeCacheTs } from 'node-cache-ts';
import { PhotoStatus } from '../repository/db';
import { flickr } from '../clients/flickrClient';

export type PhotoCommentsCache = NodeCacheTs<{ photo_id: string }, any>;
export const photoCommentsCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 600 }, async (args: { photo_id: string }): Promise<any> => {
    return await flickr("flickr.photos.comments.getList", {
        photo_id: args.photo_id
    });
});

export type PhotoSizesCache = NodeCacheTs<{ photo_id: string }, any>;
export const photoSizesCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 600 }, async (args: { photo_id: string }): Promise<any> => {
    return await flickr("flickr.photos.getSizes", {
        photo_id: args.photo_id
    });
});

export type PhotoStatusCache = NodeCacheTs<{ photo_id: string }, any>;
export const photoStatusCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 180 }, async (args: { photo_id: string }): Promise<any> => {
    return await getPhotoStatusFromDb(args.photo_id);
});

export type PhotoContextCache = NodeCacheTs<{ photo_id: string }, any>;
export const photoContextCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 600 }, async (args: { photo_id: string }): Promise<any> => {
    return await flickr("flickr.photos.getAllContexts", {
        photo_id: args.photo_id
    });
});

async function getPhotoStatusFromDb(photo_id: string) {
    const id = new String(photo_id)
    let photoStatus = await PhotoStatus.findById(id).lean().exec();
    if(!photoStatus) {
        await PhotoStatus.create({_id: id});
        photoStatus = await PhotoStatus.findById(id).lean().exec();
    }

    return photoStatus;
}