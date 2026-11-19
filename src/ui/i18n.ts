// Interface labels in English and Setswana. Submissions stay in English (call rules),
// but navigating the portal in Setswana lowers the barrier for first-time applicants.
import { loadPrefs } from './prefs';
const TN: Record<string, string> = {
  'Open calls': 'Dikopo tse di bulegileng',
  'Idea bank': 'Polokelo ya dikakanyo',
  'Track an idea': 'Latedisa kakanyo',
  'How it works': 'Go dira jang',
  'Help': 'Thuso',
  'Sign in': 'Tsena',
  'Create account': 'Ipandise',
  'My workspace': 'Kwa ke dirang teng',
  'Submit an idea': 'Romela kakanyo',
  'Live chat': 'Puisano',
  'Submission': 'Go romela',
  'Review': 'Tshekatsheko',
  'Feedback': 'Maikutlo',
  'Approval': 'Tumelelo',
  'Award': 'Sekgele',
  'Develop': 'Tlhabololo',
  'Every idea gets a fair hearing.': 'Kakanyo nngwe le nngwe e reediwa ka tekatekano.',
};
export function t(s: string): string {
  return loadPrefs().lang === 'tn' ? TN[s] ?? s : s;
}
