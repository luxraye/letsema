import type { InstanceDefinition, FieldDef, Criterion } from '@/db/schema';

export const SECTORS = ['Agriculture & agro-processing', 'Digital & technology', 'Manufacturing', 'Tourism & creative', 'Green energy & climate', 'Health & wellness', 'Services & retail', 'Mining services'];
export const DISTRICTS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe', 'Palapye', 'Mahalapye', 'Molepolole', 'Kanye', 'Lobatse', 'Selebi-Phikwe', 'Ghanzi', 'Tsabong', 'Letlhakane'];

export const REGULATORS = [
  { name: 'CIPA', full: 'Companies and Intellectual Property Authority', why: 'Register your company, business name, trademark or patent.', url: 'https://www.cipa.co.bw' },
  { name: 'BURS', full: 'Botswana Unified Revenue Service', why: 'Tax registration (TIN), VAT and tax clearance certificates.', url: 'https://www.burs.org.bw' },
  { name: 'NBFIRA', full: 'Non-Bank Financial Institutions Regulatory Authority', why: 'Needed for fintech, lending, insurance and investment products.', url: 'https://www.nbfira.org.bw' },
  { name: 'BoB', full: 'Bank of Botswana', why: 'Payment systems, e-money and the regulatory sandbox.', url: 'https://www.bankofbotswana.bw' },
  { name: 'BOCRA', full: 'Botswana Communications Regulatory Authority', why: 'Telecoms, internet, broadcasting, postal and .bw domains.', url: 'https://www.bocra.org.bw' },
  { name: 'IDPC', full: 'Information and Data Protection Commission', why: 'Personal data under the Data Protection Act 2024.', url: 'https://www.idpc.org.bw' },
  { name: 'BOBS', full: 'Botswana Bureau of Standards', why: 'Product standards, testing and certification marks.', url: 'https://www.bobstandards.bw' },
  { name: 'CCA', full: 'Competition and Consumer Authority', why: 'Fair competition, mergers and consumer protection.', url: 'https://www.competitionauthority.co.bw' },
  { name: 'LEA', full: 'Local Enterprise Authority', why: 'SME mentoring, incubation and market access.', url: 'https://www.lea.co.bw' },
];

export const STANDARD_FORM: FieldDef[] = [
  { key: 'problem', label: 'What problem are you solving?', help: 'Who has this problem, and how do you know?', type: 'textarea', required: true, maxWords: 250 },
  { key: 'solution', label: 'What is your solution?', help: 'Describe it so a non-expert understands.', type: 'textarea', required: true, maxWords: 300 },
  { key: 'market', label: 'Who will pay, and how many are there?', type: 'textarea', required: true, maxWords: 200 },
  { key: 'traction', label: 'What have you done so far?', help: 'Pilots, customers, prototypes, revenue.', type: 'textarea', maxWords: 200 },
  { key: 'jobs', label: 'How many jobs could this create in two years?', type: 'number', required: true },
  { key: 'funding', label: 'How much funding do you need (Pula)?', type: 'number', required: true },
  { key: 'use_of_funds', label: 'What will the money be spent on?', type: 'textarea', required: true, maxWords: 150 },
  { key: 'pitch', label: 'Pitch deck', help: 'PDF, up to 10 pages.', type: 'file', required: true, accept: ['pdf'], maxMb: 10, maxPages: 10 },
];

export const STANDARD_RUBRIC: Criterion[] = [
  { key: 'innovation', label: 'Innovation', weight: 25, guide: 'How new is this for Botswana? 0 = copy of existing, 10 = genuinely new.' },
  { key: 'impact', label: 'Impact and jobs', weight: 25, guide: 'Jobs, inclusion and benefit to communities and the economy.' },
  { key: 'viability', label: 'Commercial viability', weight: 25, guide: 'Will customers pay? Is the plan realistic?' },
  { key: 'team', label: 'Team and ability to deliver', weight: 15, guide: 'Do they have the skills and commitment?' },
  { key: 'funds', label: 'Use of funds', weight: 10, guide: 'Is the budget clear, fair and linked to milestones?' },
];

export const HACKATHON_RUBRIC: Criterion[] = [
  { key: 'general', label: 'General: branding, browser access, sign-in, hosting', weight: 15, guide: 'CEDA-directed look, works in any browser, self-registration with validation, password/OTP/biometrics, password recovery, hosting and 24/7 availability.' },
  { key: 'functionality', label: 'Functionality: content, evaluation, feedback, chat, reports, alerts', weight: 20, guide: 'Admin content and form control, multi-level evaluation, feedback and iteration, live chat, support turnaround, FAQs and regulators, dashboards, free alerts.' },
  { key: 'ux', label: 'User experience', weight: 15, guide: 'Intuitive, easy navigation, attractive.' },
  { key: 'technical', label: 'Technical: roles, speed, audit, security, devices, scale', weight: 25, guide: 'Role-based access, response time, audit trail, cyber security and privacy, cross-browser and device, scalability.' },
  { key: 'innovation', label: 'Innovation and creativity', weight: 10, guide: 'Goes beyond the brief in useful ways.' },
  { key: 'presentation', label: 'Presentation', weight: 15, guide: 'Clear, confident demo and answers.' },
];

export function standardDefinition(over: Partial<InstanceDefinition> = {}): InstanceDefinition {
  return {
    kind: 'call', audience: 'public',
    stages: [
      { key: 'apply', label: 'Applications open', starts: '2026-10-01', ends: '2026-11-30' },
      { key: 'screen', label: 'Screening', starts: '2026-12-01', ends: '2026-12-07' },
      { key: 'score', label: 'Independent scoring', starts: '2026-12-08', ends: '2026-12-21' },
      { key: 'panel', label: 'Panel decision', starts: '2027-01-11', ends: '2027-01-15' },
      { key: 'award', label: 'Awards and onboarding', starts: '2027-01-18', ends: '2027-01-29' },
    ],
    form: STANDARD_FORM,
    rubric: STANDARD_RUBRIC,
    eligibility: { minAge: 18, maxAge: 35, citizenOnly: true, minYouthShare: 50, cipaRequired: true },
    team: { min: 1, max: 5 },
    reviewersPerEntry: 3,
    shortlistSize: 10,
    prizes: [],
    sectors: SECTORS,
    ...over,
  };
}
