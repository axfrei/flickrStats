import { isEmpty } from "lodash";
import { IPhotoStatus } from "../types/photoStatus";
import { GroupDefinition, GroupFamlily, PromoteRule } from "../types/suggestionEngine";
import { PhotoStatusCache } from "./photoServiceCaches";
import { PhotoStatus } from "../repository/db";
import { logger } from "../logger";

export default class SuggestionEngineService {
    promoteRules: { commentCount: { meetPromoteRule: (opts: { photoGroupCommentsCount: number; familyGroupCommentsCount: number; promoteRuleParams: { commentCount: number; secondChanceCount: number; }; }) => boolean; meetSecondChanceRule: (opts: { photoGroupCommentsCount: number; familyGroupCommentsCount: number; promoteRuleParams: { commentCount: number; secondChanceCount: number; }; }) => boolean; }; familyGroupCommentsCount: { meetPromoteRule: (opts: { photoGroupCommentsCount: number; familyGroupCommentsCount: number; promoteRuleParams: { commentCount: number; secondChanceCount: number; }; }) => boolean; meetSecondChanceRule: (opts: { photoGroupCommentsCount: number; familyGroupCommentsCount: number; promoteRuleParams: { commentCount: number; secondChanceCount: number; }; }) => boolean; }; favCount: { meetPromoteRule: () => boolean; meetSecondChanceRule: () => boolean; }; default: { meetPromoteRule: () => boolean; meetSecondChanceRule: () => boolean; }; };

    constructor(private readonly photoStatusCache: PhotoStatusCache) {
        this.promoteRules = {
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
            },
            favCount: {
                meetPromoteRule: () => false,
                meetSecondChanceRule: () => false
            },
            default: {
                meetPromoteRule: () => false,
                meetSecondChanceRule: () => false
            }
        }
    }

    private meetPromoteRule = (photoGroupCommentsCount: number, familyGroupCommentsCount, promoteRule: PromoteRule) => {
        const pr = this.promoteRules[promoteRule.name] || this.promoteRules.default;
        return pr.meetPromoteRule({
            photoGroupCommentsCount,
            familyGroupCommentsCount,
            promoteRuleParams: promoteRule.params
        });
    }

    private meetSecondChanceRule = (photoGroupCommentsCount: number, familyGroupCommentsCount, promoteRule: PromoteRule) => {
        const pr = this.promoteRules[promoteRule.name] || this.promoteRules.default;
        return pr.meetSecondChanceRule({
            photoGroupCommentsCount,
            familyGroupCommentsCount,
            promoteRuleParams: promoteRule.params
        });
    }

    private updatePhotoStatus = async (photoCurrentStatus: IPhotoStatus, groupFamily: GroupFamlily, nextGroupIndex: number) => {
        const newStatus = {
            ...photoCurrentStatus,
            groups: {
                ...photoCurrentStatus.groups,
                [groupFamily.name]: {
                    currentLevel: nextGroupIndex
                }
            }
        };
        await this.setPhotoStatus(newStatus);
    }

    private contentMatchRule = (comment: string, group: GroupDefinition): boolean => {
        if (group.commentMatchRegex) {
            return new RegExp(group.commentMatchRegex).test(comment);
        }

        if (group.commentMatch) {
            return comment.search(group.commentMatch) >= 0
        }

        return false;
    }

    private setPhotoStatus = async (photoCurrentStatus: IPhotoStatus) => {
        await PhotoStatus.updateOne({ _id: photoCurrentStatus._id }, {
            $set: {
                groups:
                    photoCurrentStatus.groups
            }
        }).exec();
        await this.photoStatusCache.set(photoCurrentStatus._id.toString(), photoCurrentStatus, 600);
    }

    meetRules = async (props: { comments: any, groupIndex: number, pool: any, photo: any, groupFamily: GroupFamlily, groupFamilyCommentCount: number, suggestions?: string[], photoCurrentStatus: IPhotoStatus }) => {
        const { comments, groupIndex, pool, photo, groupFamily, groupFamilyCommentCount, suggestions = [], photoCurrentStatus } = props;
        const group = groupFamily.groups[groupIndex];
        if (group === undefined || group.nextGroup === 'END') {
            return suggestions;
        }

        const nextGroup = group.nextGroup || groupFamily.groups[groupIndex + 1]?.nsid;
        const photoGroupCommentsCount = comments.comment.filter((comment: { _content: string }) => this.contentMatchRule(comment._content, group)).length;
        const promoteRule = group.promoteRule || groupFamily.promoteRule;
        const meetPromoteRule_ = this.meetPromoteRule(photoGroupCommentsCount, groupFamilyCommentCount, promoteRule);
        const meetSecondChanceRule_ = !meetPromoteRule_ && this.meetSecondChanceRule(photoGroupCommentsCount, groupFamilyCommentCount, promoteRule);
        const meetRuleNotAlreadyInNextGroup = pool.find(pool => pool.id === nextGroup) === undefined;


        if (meetPromoteRule_ && meetRuleNotAlreadyInNextGroup) {
            suggestions.push(
                !isEmpty(nextGroup) ? `Promote to ${groupFamily.groups.find(g => g.nsid === nextGroup).name}` : `Please check ${groupFamily.name}`
            )
        }

        if (meetSecondChanceRule_) {
            suggestions.push(`Post to second chance to ${group.name}: ${promoteRule.name === 'familyGroupCommentsCount' ? groupFamilyCommentCount : photoGroupCommentsCount}/${(promoteRule).params.commentCount} `)
        }

        if (meetPromoteRule_ && !meetRuleNotAlreadyInNextGroup && !isEmpty(nextGroup)) {
            logger.info(`Photo ${photo.id} completes group ${group.name}`)
            const nextGroupIndex = group.nextGroup ? groupFamily.groups.findIndex(g => g.nsid === group.nextGroup) : groupIndex + 1;
            await this.updatePhotoStatus(photoCurrentStatus, groupFamily, nextGroupIndex);
            return this.meetRules({
                comments,
                groupIndex: nextGroupIndex,
                pool,
                photo,
                groupFamily,
                groupFamilyCommentCount: groupFamilyCommentCount + photoGroupCommentsCount,
                suggestions,
                photoCurrentStatus
            })
        }

        return suggestions;
    }

}