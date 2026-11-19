import { shortCode } from './crypto';
export const awardCode = (ref: string, amount: number) => shortCode(`${ref}:${amount}`);
