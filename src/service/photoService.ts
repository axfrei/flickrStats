import { flickr } from '../clients/flickrClient';
import { isEmpty } from 'lodash';
import groupFamilies from '../assets/groups.json';
import { GroupFamlily, PhotoSuggestion } from "../types/suggestionEngine";
import { IPhotoStatus } from "../types/photoStatus";
import { photoCommentsCache, photoContextCache, photoStatusCache, photoSizesCache } from './photoServiceCaches';
import { meetRules } from './suggestionEngineService';


export const getPhotoInfo = async (photo_id: string) => {
    const res = await flickr("flickr.photos.getInfo", {
        photo_id
    });

    return res;
}

export const getPhotoComments = (photo_id: string) => {
    return photoCommentsCache.call(photo_id, { photo_id });
}

export const getAllContexts = async (photo_id: string) => {
    return photoContextCache.call(photo_id, { photo_id });
}

export const getPublicPhotos = async (user_id: string, page?: number) => {
    const res = await flickr("flickr.people.getPublicPhotos", {
        user_id,
        per_page: '500',
        page: page && page.toString()
    });

    return res.page < res.pages ? [...res.photos.photo, ...getPublicPhotos(user_id, res.page + 1)] : res.photos.photos;
}

export const getPublicPhotosOfGroup = async (user_id: string, group_id: string, page?: number) => {
    const res = await flickr("flickr.groups.pools.getPhotos", {
        group_id,
        user_id,
        per_page: '500',
        page: page && page.toString()
    });

    return res.page < res.pages ? [...res.photos?.photo, ...getPublicPhotosOfGroup(user_id, res.page + 1)] : res.photos?.photo;
}

export const getPublicGroups = async (user_id: string) => {
    const res = await flickr("flickr.people.getPublicGroups", {
        user_id
    });

    return res;
}

export const getPhotoSizes = (photo_id: string) => {
   return photoSizesCache.call(photo_id, {photo_id});
}

const getPhotoStatus = async (photo_id: string) => {
    return photoStatusCache.call(photo_id, { photo_id });
 }

export const suggestActions = async (params) => {
    const { user_id = process.env.USER_ID, familyGroups = [], photos_id = [] } =  params
    const suggestions = {};
    for (const groupFamily of groupFamilies.filter((gf: GroupFamlily) => !gf.disabled && (isEmpty(familyGroups) || familyGroups.includes(gf.name)))) {
        console.log(`Checking group family ${groupFamily.name}`)
        const level0 = groupFamily.groups[0];
        try {
            const photos = await getPublicPhotosOfGroup(user_id, level0.nsid);
            for await (const photo of photos.filter(p => isEmpty(photos_id) || photos_id.includes(p.id) )) {
                const photoCurrentStatus:IPhotoStatus = await getPhotoStatus(photo.id);
                const { comments } = await getPhotoComments(photo.id);
                const { pool } = await getAllContexts(photo.id);
                const photoSuggestion: PhotoSuggestion = suggestions[photo.id] || {
                    id: photo.id,
                    title: photo.title,
                    url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`,
                    ...(await getPhotoSizes(photo.id)),
                    suggestions: []
                }
                photoCurrentStatus.groups = photoCurrentStatus.groups || {};
                photoCurrentStatus.groups[groupFamily.name] = photoCurrentStatus.groups[groupFamily.name]  || {
                    currentLevel: 0
                };
                photoSuggestion.suggestions = [...photoSuggestion.suggestions, ...await meetRules({
                    comments,
                    groupIndex: photoCurrentStatus.groups[groupFamily.name].currentLevel,
                    pool,
                    photo,
                    groupFamily,
                    groupFamilyCommentCount: 0,
                    photoCurrentStatus
                })];
                !isEmpty(photoSuggestion.suggestions) && (suggestions[photo.id] = photoSuggestion);
            };
        } catch (e) {
            console.log(e);
        }
    }

    return Object.keys(suggestions).map(key => suggestions[key]);

}



