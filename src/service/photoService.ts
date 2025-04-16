import { flickr } from '../clients/flickrClient';
import { isEmpty } from 'lodash';
import groupFamilies from '../assets/groups.json';
import { GroupFamlily, PhotoSuggestion } from "../types/suggestionEngine";
import { IPhotoStatus } from "../types/photoStatus";
import { photoStatusCache, photoSizesCache, PhotoCommentsCache, PhotoContextCache } from './photoServiceCaches';
import SuggestionEngingService from './suggestionEngineService';
import logger, { Logger } from 'pino';

export default class PhotoService {
    logger: Logger;

    constructor(private readonly suggestionEngineService: SuggestionEngingService,
        private readonly photoCommentsCache: PhotoCommentsCache,
        private readonly photoContextCache: PhotoContextCache
    ) {
        this.logger = logger();
    }

    getPhotoInfo = async (photo_id: string) => {
        const res = await flickr("flickr.photos.getInfo", {
            photo_id
        });

        return res;
    }

    getPhotoComments = (photo_id: string) => {
        return this.photoCommentsCache.call(photo_id, { photo_id });
    }

    getAllContexts = async (photo_id: string) => {
        return this.photoContextCache.call(photo_id, { photo_id });
    }

    getPublicPhotos = async (user_id: string, page?: number) => {
        const res = await flickr("flickr.people.getPublicPhotos", {
            user_id,
            per_page: '500',
            page: page && page.toString()
        });

        return res.page < res.pages ? [...res.photos.photo, ...this.getPublicPhotos(user_id, res.page + 1)] : res.photos.photos;
    }

    getPublicPhotosOfGroup = async (user_id: string, group_id: string, page?: number) => {
        const res = await flickr("flickr.groups.pools.getPhotos", {
            group_id,
            user_id,
            per_page: '500',
            page: page && page.toString()
        });

        return res.page < res.pages ? [...res.photos?.photo, ...this.getPublicPhotosOfGroup(user_id, res.page + 1)] : res.photos?.photo;
    }

    getPublicGroups = async (user_id: string) => {
        const res = await flickr("flickr.people.getPublicGroups", {
            user_id
        });

        return res;
    }

    getPhotoSizes = (photo_id: string) => {
        return photoSizesCache.call(photo_id, { photo_id });
    }

    private getPhotoStatus = async (photo_id: string) => {
        return photoStatusCache.call(photo_id, { photo_id });
    }

    suggestActions = async (params) => {
        const { user_id = process.env.USER_ID, familyGroups = [], photos_id = [] } = params
        const suggestions = {};
        const groupsToCheck = groupFamilies.filter((gf: GroupFamlily) => !gf.disabled && (isEmpty(familyGroups) || familyGroups.includes(gf.name)));
        for (const groupFamily of groupsToCheck) {
            this.logger.info(`Checking group family ${groupFamily.name}`)
            const level0 = groupFamily.groups[0];
            try {
                const photos = (await this.getPublicPhotosOfGroup(user_id, level0.nsid)).filter(p => isEmpty(photos_id) || photos_id.includes(p.id));
                for await (const photo of photos) {
                    const photoCurrentStatus: IPhotoStatus = await this.getPhotoStatus(photo.id);
                    const { comments } = await this.getPhotoComments(photo.id);
                    const { pool } = await this.getAllContexts(photo.id);
                    const photoSuggestion: PhotoSuggestion = suggestions[photo.id] || {
                        id: photo.id,
                        title: photo.title,
                        url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`,
                        ...(await this.getPhotoSizes(photo.id)),
                        suggestions: []
                    }
                    photoCurrentStatus.groups = photoCurrentStatus.groups || {};
                    photoCurrentStatus.groups[groupFamily.name] = photoCurrentStatus.groups[groupFamily.name] || {
                        currentLevel: 0
                    };
                    photoSuggestion.suggestions = [...photoSuggestion.suggestions, ...await this.suggestionEngineService.meetRules({
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
                this.logger.error(e);
            }
        }

        return Object.keys(suggestions).map(key => suggestions[key]);

    }
}



