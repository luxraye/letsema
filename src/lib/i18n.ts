import { cookies } from 'next/headers';

/** Menus and key labels in Setswana. Long-form content stays in English for now. */
const TN: Record<string, string> = {
  'Competitions': 'Dikgaisano', 'How it works': 'Go dira jang', 'Track': 'Sala morago', 'Help': 'Thuso', 'Community': 'Setšhaba',
  'Sign in': 'Tsena', 'Create account': 'Ikwadise', 'Dashboard': 'Tafole', 'Sign out': 'Tswa', 'Apply': 'Ikwadisetsa',
  'My applications': 'Dikopo tsa me', 'Notifications': 'Dikitsiso', 'Profile': 'Porofaele', 'Reports': 'Dipego',
  'Funded': 'Ba ba thusitsweng', 'Status': 'Seemo', 'Privacy': 'Sephiri', 'For judges': 'Ba ba atlholang', 'Live chat': 'Puisano',
  'Am I eligible?': 'A ke a tshwanela?', 'Am I Eligible?': 'A ke a tshwanela?', 'See Open Competitions': 'Bona dikgaisano tse di butsweng',
  'Compete': 'Gaisana', 'Showcase': 'Bontsha', 'Learn': 'Ithute', 'Partners': 'Balekane', '5-Min Judges’ Tour': 'Loeto la baatlhodi',
};
export async function getLang() { return ((await cookies()).get('lang')?.value === 'tn' ? 'tn' : 'en') as 'en' | 'tn'; }
export async function t() { const lang = await getLang(); return (s: string) => (lang === 'tn' ? TN[s] ?? s : s); }
