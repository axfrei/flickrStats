export interface IPhotoStatus {
    _id: String;
    groups: {
        [key: string]: IFamilyGroup
    }
}

export interface IFamilyGroup {
    currentLevel: number;
    // levels: IGroup[];
}

interface IGroup {
    id: String;
    chainIndex: number;
    complete: boolean;
    postedSecondChange: boolean;
}