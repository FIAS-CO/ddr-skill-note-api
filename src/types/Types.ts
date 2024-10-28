export const CHART_TYPES = ['BESP', 'BSP', 'DSP', 'ESP', 'CSP', 'BDP', 'DDP', 'EDP', 'CDP'] as const;
export type ChartType = typeof CHART_TYPES[number];
export type PlayStyle = 'SP' | 'DP';

export const CATEGORY = ['CLASSIC', 'WHITE', 'GOLD'] as const;
export type Category = typeof CATEGORY[number];

export const VERSION = [
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
    'X', 'X2', 'X3', '2013', '2014',
    'A', 'A20', 'A20 PLUS', 'A3', 'WORLD'
] as const;
export type Version = (typeof VERSION)[number];

export const FLARE_RANK = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'EX'] as const;
export type FlareRank = typeof FLARE_RANK[number];

