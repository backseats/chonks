import { Category } from "./Category";

export type CurrentChonk = {
    tokenId: number;
    head: {
        tokenId: number; // 0 if not equipped
        category: Category;
        isEquipped: boolean;
    };
    hair: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    face: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    accessory: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    top: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    bottom: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    shoes: {
        tokenId: number;
        category: Category;
        isEquipped: boolean;
    };
    bodyIndex: number;
    backgroundColor: string;
    render3D: boolean;
}; 