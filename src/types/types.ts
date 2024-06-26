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