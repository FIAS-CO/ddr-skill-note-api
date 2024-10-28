import { Category, FlareRank } from "../types/Types";

export function versionToCategory(version: string): Category {
    const VERSION_CATEGORY_MAP: { [key: string]: Category } = {
        '1st': 'CLASSIC',
        '2nd': 'CLASSIC',
        '3rd': 'CLASSIC',
        '4th': 'CLASSIC',
        '5th': 'CLASSIC',
        'MAX': 'CLASSIC',
        'MAX2': 'CLASSIC',
        'EXTREME': 'CLASSIC',
        'Super Nova': 'CLASSIC',
        'Super Nova2': 'CLASSIC',
        'X': 'CLASSIC',
        'X2': 'CLASSIC',
        'X3': 'CLASSIC',
        '2013': 'WHITE',
        '2014': 'WHITE',
        'A': 'WHITE',
        'A20': 'GOLD',
        'A20 PLUS': 'GOLD',
        'A3': 'GOLD',
        'WORLD': 'GOLD'
    };

    return VERSION_CATEGORY_MAP[version] || 'CLASSIC';
}

export function convertToDisplayFlareRank(flareRankNumber: string): FlareRank {
    switch (flareRankNumber) {
        case '0': return '0';
        case '1': return 'I';
        case '2': return 'II';
        case '3': return 'III';
        case '4': return 'IV';
        case '5': return 'V';
        case '6': return 'VI';
        case '7': return 'VII';
        case '8': return 'VIII';
        case '9': return 'IX';
        case '10': return 'EX';
        default: return '0';
    }
}
