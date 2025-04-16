export interface IPhotoStatus {
    _id: string;
    groups: {
        [key: string]: IFamilyGroup
    }
}

export interface IFamilyGroup {
    currentLevel: number;
}