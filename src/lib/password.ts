import bcrypt from 'bcryptjs';
export const hashPassword = (p: string) => bcrypt.hash(p, 11);
export const checkPassword = (p: string, h: string) => bcrypt.compare(p, h);
export function passwordProblem(p: string) {
  if (p.length < 10) return 'Use at least 10 characters.';
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) return 'Use letters and at least one number.';
  if (/^(password|qwerty|12345)/i.test(p)) return 'That password is too easy to guess.';
  return null;
}
