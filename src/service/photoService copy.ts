import { createFlickr } from "flickr-sdk"
import { isEmpty } from 'lodash';
import groupFamilies from '../assets/groups.json';

const { flickr } = createFlickr("d3dfe4509e2631a6b7ced57f4c0f7745")


export const getPhotoInfo = async (photo_id: string) => {
    const res = await flickr("flickr.photos.getInfo", {
        photo_id
    });

    return res;
}

export const getPhotoComments = async (photo_id: string) => {
    const res = await flickr("flickr.photos.comments.getList", {
        photo_id
    });

    return res;
}

export const getAllContexts = async (photo_id: string) => {
    const res = await flickr("flickr.photos.getAllContexts", {
        photo_id
    });

    return res;
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

const getPhotosWithGroupsAndComments = async (user_id: string, suggestions: any = []) => {
    const { photos } = await getPublicPhotos(user_id);
    photos.photo.forEach(async (photo: any) => {
        const photoContext = await getAllContexts(photo.id);
        !isEmpty(photoContext.pool) &&
            suggestions.push({
                id: photo.id,
                title: photo.title,
                groups: photoContext.pool,
                ...{ ...await getPhotoComments(photo.id) }
            })
    });

    return suggestions;
}

export const suggestActions = async (user_id: string = '21856482@N05') => {
    const suggestions = [];
    for(const groupFamily of groupFamilies) {
        for await (const group of groupFamily.groups) {
            const photos = await getPublicPhotosOfGroup(user_id, group.nsid)
            for await (const photo of photos) {
                const { comments } = await getPhotoComments(photo.id);
                const photoGroupComments = comments.comment.filter(comment => comment._content.search(group.commentMatch) >= 0);
                const meet1stRule = photoGroupComments && photoGroupComments.length >= group.commentCount;
                if(!meet1stRule) continue;
                const { pool } = await getAllContexts(photo.id);
                const meet2ndRule = pool.find(pool => pool.id === group.nextGroup) === undefined;
                if(!meet2ndRule) continue;
            
                suggestions.push({
                    id: photo.id,
                    title: photo.title,
                    suggestion: !isEmpty(group.nextGroup)? `Promote to ${groupFamily.groups.find(g => g.nsid === group.nextGroup).name}` : 'Please check'
                })
            };
        }
    }
    return suggestions;

}