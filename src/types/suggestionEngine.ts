import { IPhotoStatus } from "./photoStatus";

export interface GroupFamlily {
    name: string;
    disabled?: boolean;
    promoteRule?: PromoteRule;
    groups: GroupDefinition[];
}

export interface PromoteRule {
    name: string;
    params: {
        commentCount?: number;
        secondChanceCount?: number;
    }
}

export interface GroupDefinition {
    commentMatchRegex?: string;
    nsid: string;
    name: string;
    commentMatch?: string;
    promoteRule?: PromoteRule;
    nextGroup?: string;
}

export interface PhotoSuggestion {
    id: string;
    title: string;
    url: string;
    // suggestions: Suggestion[];
    suggestions: string[]
}

export interface Suggestion {
    suggestion: string;
    groupUrl: string;
}


export interface PhotoData {
    dateadded: string;
    farm: number;
    id: string;
    isfamily: number;
    isfriend: number;
    ispublic: number;
    owner: string;
    ownername: string;
    secret: string;
    server: string;
    title: string;
}

export interface IMeetRuleParams {
    comments: any;
    groupIndex: number;
    pool: any;
    photo: any;
    groupFamily: GroupFamlily;
    groupFamilyCommentCount: number;
    suggestions?: string[];
    photoCurrentStatus: IPhotoStatus;
}