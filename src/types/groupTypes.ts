export interface GroupFamlily {
    name: string;
    groups: GroupDefinition[];
}

export interface GroupDefinition {
    name: string;
    commentMatch: string;
    commentCount: number;
    secondChanceCount: number;
    nextGroup: string;
}