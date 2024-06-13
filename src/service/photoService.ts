import { createFlickr } from "flickr-sdk"
import { isEmpty } from 'lodash';
import groupFamilies from '../assets/groups.json';
import { NodeCacheTs } from 'node-cache-ts';
import { GroupFamlily, PhotoSuggestion, PromoteRule } from "../types/types";

const { flickr } = createFlickr({
    consumerKey: process.env.FLICKR_CONSUMER_KEY,
    consumerSecret: process.env.FLICKR_CONSUMER_SECRET,
    oauthToken: process.env.FLICKR_OAUTH_TOKEN,
    oauthTokenSecret: process.env.FLICKR_OAUTH_SECRET
})

export const getPhotoInfo = async (photo_id: string) => {
    const res = await flickr("flickr.photos.getInfo", {
        photo_id
    });

    return res;
}

const photoCommentsCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 600 }, async (args: { photo_id: string }): Promise<any> => {
    return await flickr("flickr.photos.comments.getList", {
        photo_id: args.photo_id
    });
});

export const getPhotoComments = async (photo_id: string) => {
    return photoCommentsCache.call(photo_id, { photo_id });
}

const photoContextCache = new NodeCacheTs<{ photo_id: string }, any>({ stdTTL: 600 }, async (args: { photo_id: string }): Promise<any> => {
    return await flickr("flickr.photos.getAllContexts", {
        photo_id: args.photo_id
    });
});

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

export const suggestActions = async (user_id: string = '21856482@N05') => {
    const suggestions = {};
    for (const groupFamily of groupFamilies.filter((gf: GroupFamlily) => !gf.disabled)) {
        console.log(`Checking group family ${groupFamily.name}`)
        const level0 = groupFamily.groups[0];
        try {
            const photos = await getPublicPhotosOfGroup(user_id, level0.nsid);
            for await (const photo of photos) {
                const { comments } = await getPhotoComments(photo.id);
                const { pool } = await getAllContexts(photo.id);
                const photoSuggestion: PhotoSuggestion = suggestions[photo.id] || {
                    id: photo.id,
                    title: photo.title,
                    url: `https://www.flickr.com/photos/${photo.owner}/${photo.id}`,
                    suggestions: []
                }
                photoSuggestion.suggestions = [...photoSuggestion.suggestions, ...meetRules(comments, 0, pool, photo, groupFamily, 0)];
                !isEmpty(photoSuggestion.suggestions) && (suggestions[photo.id] = photoSuggestion);
            };
        } catch (e) {
            console.log(e);
        }
    }

    return suggestions;

}

const promoteRules = {
    commentCount: {
        meetPromoteRule: (opts: { photoGroupCommentsCount: number, familyGroupCommentsCount: number, promoteRuleParams: { commentCount: number, secondChanceCount: number } }) => {
            const { photoGroupCommentsCount, promoteRuleParams } = opts;
            return photoGroupCommentsCount >= (promoteRuleParams.commentCount)
        },
        meetSecondChanceRule: (opts: { photoGroupCommentsCount: number, familyGroupCommentsCount: number, promoteRuleParams: { commentCount: number, secondChanceCount: number } }) => {
            const { photoGroupCommentsCount, promoteRuleParams } = opts;
            return photoGroupCommentsCount >= (promoteRuleParams.secondChanceCount || 1000000);
        }
    },
    familyGroupCommentsCount: {
        meetPromoteRule: (opts: { photoGroupCommentsCount: number, familyGroupCommentsCount: number, promoteRuleParams: { commentCount: number, secondChanceCount: number } }) => {
            const { photoGroupCommentsCount, familyGroupCommentsCount, promoteRuleParams } = opts;
            return photoGroupCommentsCount + familyGroupCommentsCount >= (promoteRuleParams.commentCount)
        },
        meetSecondChanceRule: (opts: { photoGroupCommentsCount: number, familyGroupCommentsCount: number, promoteRuleParams: { commentCount: number, secondChanceCount: number } }) => {
            const { photoGroupCommentsCount, familyGroupCommentsCount, promoteRuleParams } = opts;
            return photoGroupCommentsCount + familyGroupCommentsCount >= (promoteRuleParams.secondChanceCount || 1000000);
        }
    }
}

const meetPromoteRule = (photoGroupCommentsCount: number, familyGroupCommentsCount, promoteRule: PromoteRule) => {
    const pr = promoteRules[promoteRule.name] || promoteRules.commentCount;
    return pr.meetPromoteRule({
        photoGroupCommentsCount,
        familyGroupCommentsCount,
        promoteRuleParams: promoteRule.params
    });
}

const meetSecondChanceRule = (photoGroupCommentsCount: number, familyGroupCommentsCount, promoteRule: PromoteRule) => {
    const pr = promoteRules[promoteRule.name] || promoteRules.commentCount;
    return pr.meetSecondChanceRule({
        photoGroupCommentsCount,
        familyGroupCommentsCount,
        promoteRuleParams: promoteRule.params
    });
}

const meetRules = (comments, groupIndex: number, pool, photo, groupFamily: GroupFamlily, groupFamilyCommentCount: number, suggestions: string[] = []) => {
    const group = groupFamily.groups[groupIndex];
    if (group === undefined || group.nextGroup === 'END') {
        return suggestions;
    }

    const nextGroup = group.nextGroup || groupFamily.groups[groupIndex + 1]?.nsid;
    const photoGroupCommentsCount = comments.comment.filter(comment => comment._content.search(group.commentMatch) >= 0).length;
    const meetPromoteRule_ = meetPromoteRule(photoGroupCommentsCount, groupFamilyCommentCount, group.promoteRule || groupFamily.promoteRule);
    const meetSecondChanceRule_ = !meetPromoteRule_ && meetSecondChanceRule(photoGroupCommentsCount, groupFamilyCommentCount, group.promoteRule || groupFamily.promoteRule);
    const meetRuleNotAlreadyInNextGroup = pool.find(pool => pool.id === nextGroup) === undefined;


    if (meetPromoteRule_ && meetRuleNotAlreadyInNextGroup) {
        suggestions.push(
            !isEmpty(nextGroup) ? `Promote to ${groupFamily.groups.find(g => g.nsid === nextGroup).name}` : `Please check ${groupFamily.name}`
        )
    }

    if (meetSecondChanceRule_) {
        suggestions.push(`Post to second chance to ${group.name}`)
    }

    if (meetPromoteRule_ && !meetRuleNotAlreadyInNextGroup && !isEmpty(nextGroup)) {
        console.log(`Photo ${photo.id} completes group ${group.name}`)
        const nextGroupIndex = group.nextGroup ? groupFamily.groups.findIndex(g => g.nsid === group.nextGroup) : groupIndex + 1;
        return meetRules(comments, nextGroupIndex, pool, photo, groupFamily, groupFamilyCommentCount + photoGroupCommentsCount, suggestions)
    }

    return suggestions;
}