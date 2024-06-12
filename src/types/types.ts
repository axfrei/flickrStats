export interface GroupFamlily {
    name: string;
    disabled?: boolean;
    commentCount?: number;
    secondChanceCount?: number;
    groups: GroupDefinition[];
}

export interface GroupDefinition {
    name: string;
    commentMatch: string;
    commentCount?: number;
    secondChanceCount?: number;
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