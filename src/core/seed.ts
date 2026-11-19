// Demo data. Every person, company and idea here is fictional.
// Dates are relative to the moment the data is created so the demo always looks current.
import { DEFAULT_ROLES } from './rbac';
import { sha256 } from './sha256';
import type {
  Campaign, Conversation, Criterion, FormField, Idea, Review, State, Status, User, HistoryItem, Milestone, Message,
} from './types';
import { DAY, rng } from './util';

export const DEMO_PASSWORD = 'Letsema2026!';
export const SCHEMA = 3;

export function hashPassword(email: string, password: string) {
  return sha256(`letsema:v1:${email.trim().toLowerCase()}:${password}`);
}

const DISTRICTS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe', 'Palapye', 'Molepolole', 'Kanye', 'Lobatse', 'Selebi-Phikwe', 'Ghanzi', 'Tsabong', 'Mahalapye', 'Jwaneng', 'Letlhakane', 'Mochudi'];

const DEFAULT_CRITERIA: Criterion[] = [
  { id: 'need', name: 'Problem & need', description: 'Is the problem real, local and clearly evidenced?', weight: 20 },
  { id: 'novelty', name: 'Innovation', description: 'How new is the approach for Botswana?', weight: 20 },
  { id: 'feasible', name: 'Feasibility', description: 'Can this team build and run it with the resources asked for?', weight: 20 },
  { id: 'market', name: 'Market & sustainability', description: 'Will people pay, and can it stand on its own?', weight: 20 },
  { id: 'impact', name: 'Citizen impact & jobs', description: 'Jobs, inclusion and benefit to citizens.', weight: 20 },
];

const STAFF_CRITERIA: Criterion[] = [
  { id: 'customer', name: 'Customer impact', description: 'How much better is it for CEDA clients?', weight: 35 },
  { id: 'saving', name: 'Time or cost saved', description: 'Measurable saving per month.', weight: 25 },
  { id: 'ease', name: 'Ease of implementation', description: 'Can it be piloted within one quarter?', weight: 20 },
  { id: 'strategy', name: 'Strategic fit', description: 'Fit with CEDA strategy and policy.', weight: 20 },
];

const DEFAULT_FORM: FormField[] = [
  { id: 'problem', label: 'What problem are you solving, and for whom?', type: 'textarea', required: true, maxLength: 1200, help: 'Describe the people affected and how you know the problem is real.' },
  { id: 'solution', label: 'What is your solution?', type: 'textarea', required: true, maxLength: 1500, help: 'Explain how it works in plain language.' },
  { id: 'customers', label: 'Who will pay for it, and how?', type: 'textarea', required: true, maxLength: 800 },
  { id: 'stage', label: 'How far along are you?', type: 'select', required: true, options: ['Just an idea', 'Prototype', 'First customers', 'Growing revenue'] },
  { id: 'jobs', label: 'Jobs you expect to create in 2 years', type: 'number', required: true, min: 0, max: 5000 },
  { id: 'ask', label: 'Funding requested (Pula)', type: 'number', required: true, min: 0, max: 5_000_000 },
  { id: 'website', label: 'Website or social page', type: 'url', required: false },
  { id: 'youth', label: 'More than 50% of the company is owned by citizens aged 18–35', type: 'checkbox', required: true },
];

const STAFF_FORM: FormField[] = [
  { id: 'problem', label: 'Which process or client experience would you improve?', type: 'textarea', required: true, maxLength: 1000 },
  { id: 'solution', label: 'Your idea', type: 'textarea', required: true, maxLength: 1500 },
  { id: 'saving', label: 'Estimated hours or Pula saved per month', type: 'number', required: true, min: 0 },
  { id: 'dept', label: 'Your department', type: 'select', required: true, options: ['Credit', 'Business Development', 'Finance', 'ICT', 'Risk & Compliance', 'Human Capital', 'Strategy', 'Branch network'] },
];

interface IdeaSeed { t: string; s: string; sector: string; problem: string; solution: string }

const AGRI: IdeaSeed[] = [
  { t: 'SoilSense moisture tags for smallholders', s: 'Solar soil-moisture tags that text farmers when to irrigate, cutting water use on small horticulture plots.', sector: 'Agriculture', problem: 'Smallholder vegetable farmers over-water during dry months and lose crops to guesswork.', solution: 'Cheap solar soil-moisture tags that send a Setswana SMS with irrigation advice.' },
  { t: 'Morula fruit cold-press cooperative', s: 'A shared cold-press and bottling unit that turns wild morula fruit into shelf-stable oil and juice for local retail.', sector: 'Agro-processing', problem: 'Morula fruit rots unpicked because rural harvesters lack processing equipment.', solution: 'A cooperative-owned cold press with shared bottling and branding.' },
  { t: 'Kraal-to-market livestock traceability app', s: 'Phone app that links bolus IDs to sale records so small cattle farmers can prove traceability and reach better buyers.', sector: 'Livestock', problem: 'Small cattle owners struggle to meet traceability requirements and sell at lower prices.', solution: 'An offline-first app that reads bolus IDs and keeps a sale-ready history.' },
  { t: 'Hydroponic fodder containers', s: 'Container units growing green fodder in 7 days to keep livestock fed through drought.', sector: 'Livestock', problem: 'Drought leaves grazing land bare and feed prices spike.', solution: 'Containerised hydroponic barley fodder sold as a weekly subscription.' },
  { t: 'Agri-drone spraying as a service', s: 'Shared drones that spray crops for groups of small farmers at a per-hectare fee.', sector: 'Agriculture', problem: 'Manual spraying is slow, unsafe and uneven.', solution: 'Book-a-drone service priced per hectare, operated by trained youth pilots.' },
  { t: 'Mophane worm processing hygiene kit', s: 'A low-cost drying and packaging kit that lets harvesters sell mophane worms to supermarkets.', sector: 'Agro-processing', problem: 'Supermarkets reject unpackaged mophane worms over hygiene concerns.', solution: 'Solar dryers, vacuum sealers and a certification checklist.' },
  { t: 'Village egg aggregation hub', s: 'Collects eggs from backyard poultry keepers, grades and sells them under one label.', sector: 'Poultry', problem: 'Backyard poultry keepers cannot reach retail volumes alone.', solution: 'A hub that grades, packs and delivers eggs from many small producers.' },
  { t: 'Rainwater harvesting finance kit', s: 'Pay-as-you-go tanks and gutters for rural households and gardens.', sector: 'Water', problem: 'Households cannot afford tanks up front.', solution: 'Mobile-money instalments with remote tank-level monitoring.' },
  { t: 'Sorghum snack bar line', s: 'Healthy snack bars made from local sorghum and morama beans for school tuck shops.', sector: 'Agro-processing', problem: 'Local grains have little value-added demand.', solution: 'A snack bar line sold to schools and filling stations.' },
  { t: 'Farm records by voice note', s: 'Farmers record expenses and harvests by WhatsApp voice note; the service builds loan-ready records.', sector: 'Agriculture', problem: 'Farmers lack records lenders accept.', solution: 'Voice notes are transcribed into monthly statements.' },
];

const GREEN: IdeaSeed[] = [
  { t: 'Solar cold rooms for informal traders', s: 'Pay-per-crate solar cold storage at bus ranks so vegetable vendors waste less.', sector: 'Energy', problem: 'Street vendors lose up to a third of produce to heat.', solution: 'Solar-powered cold rooms rented per crate per day.' },
  { t: 'Tyre-to-paver recycling plant', s: 'Turns waste tyres into rubber paving blocks for schools and clinics.', sector: 'Waste', problem: 'Waste tyres pile up and are burnt in the open.', solution: 'Shred and bind tyres into durable pavers.' },
  { t: 'Biogas from abattoir waste', s: 'Digesters at small abattoirs produce gas for cooking and cut pollution.', sector: 'Energy', problem: 'Abattoir waste pollutes water and attracts pests.', solution: 'Containerised biogas digesters with gas sold to nearby households.' },
  { t: 'E-bike delivery fleet for Gaborone', s: 'Battery-swap e-bikes for delivery riders, financed per kilometre.', sector: 'Mobility', problem: 'Delivery riders spend most of their earnings on fuel.', solution: 'Swap stations and pay-per-km e-bikes.' },
  { t: 'Smart water meters for townships', s: 'Prepaid smart meters that detect leaks and alert households by SMS.', sector: 'Water', problem: 'Leaks go unnoticed and bills shock households.', solution: 'Prepaid meters with leak alerts.' },
  { t: 'Glass bottle return network', s: 'Deposit-return kiosks at shops that pay cash for glass bottles.', sector: 'Waste', problem: 'Glass goes to landfill with no return incentive.', solution: 'Kiosks paying a small deposit per bottle.' },
  { t: 'Solar irrigation pump leasing', s: 'Lease-to-own solar pumps for small farms along the Limpopo.', sector: 'Energy', problem: 'Diesel pumps are costly and unreliable.', solution: 'Lease-to-own pumps with remote monitoring.' },
  { t: 'Clay brick kiln efficiency retrofit', s: 'Retrofits traditional kilns to use 30% less wood.', sector: 'Construction', problem: 'Brick makers burn large volumes of wood.', solution: 'A retrofit kit and training for kiln operators.' },
  { t: 'Upcycled fashion from shweshwe offcuts', s: 'A label that turns tailoring offcuts into bags and accessories.', sector: 'Creative', problem: 'Fabric offcuts are thrown away.', solution: 'Collect, design and sell upcycled accessories.' },
];

const DIGITAL: IdeaSeed[] = [
  { t: 'Tswana-first bookkeeping app for spaza shops', s: 'A simple phone app in Setswana that tracks stock, sales and credit for tuck shops.', sector: 'Fintech', problem: 'Small shops keep no records and cannot access credit.', solution: 'A Setswana-first phone app that builds a credit history.' },
  { t: 'Tender alerts for small suppliers', s: 'Matches small businesses with public and private tenders they qualify for.', sector: 'Digital services', problem: 'Small businesses miss tenders they could win.', solution: 'Personalised tender alerts and document checklists.' },
  { t: 'Queue-free clinic booking by USSD', s: 'Book a clinic slot by USSD, no smartphone needed.', sector: 'Health tech', problem: 'Patients queue for hours at clinics.', solution: 'USSD booking with SMS reminders.' },
  { t: 'Artisan marketplace with escrow', s: 'An online marketplace for Botswana crafts with secure escrow payments.', sector: 'E-commerce', problem: 'Artisans are paid late or not at all by remote buyers.', solution: 'Marketplace with escrow and courier integration.' },
  { t: 'Driving-school scheduling platform', s: 'Online booking and progress tracking for driving schools.', sector: 'Digital services', problem: 'Learners and schools juggle paper schedules.', solution: 'Booking, payments and progress cards in one app.' },
  { t: 'Payroll for micro-employers', s: 'Simple payroll and payslips for employers with 1–10 staff.', sector: 'Fintech', problem: 'Micro-employers handle payroll on paper.', solution: 'SMS payslips and statutory deduction calculator.' },
  { t: 'Digital menu & ordering for chesa nyama', s: 'QR menus and pre-ordering for braai spots and food stalls.', sector: 'Hospitality', problem: 'Long waits and lost orders at busy food stalls.', solution: 'QR menu with pre-order and mobile-money payment.' },
  { t: 'Rental-property manager for landlords', s: 'Rent reminders, receipts and maintenance requests for small landlords.', sector: 'Proptech', problem: 'Small landlords chase rent manually.', solution: 'Automated reminders and digital receipts.' },
];

const INSIDE: IdeaSeed[] = [
  { t: 'Loan application checklist that checks itself', s: 'An online checklist that flags missing documents before an application reaches a credit officer.', sector: 'Credit', problem: 'Applications bounce back several times for missing documents.', solution: 'A self-checking digital checklist shared with the applicant.' },
  { t: 'WhatsApp status updates for clients', s: 'Clients receive automatic WhatsApp updates when their application moves.', sector: 'Business Development', problem: 'Clients call branches repeatedly to ask about status.', solution: 'Automated status messages at each step.' },
  { t: 'Mentor matching for funded businesses', s: 'Match each funded business with a mentor from the private sector.', sector: 'Business Development', problem: 'Funded businesses lack ongoing guidance.', solution: 'A mentor pool and matching scorecard.' },
  { t: 'Branch queue display with SMS call-up', s: 'Clients take a ticket and get an SMS when it is their turn.', sector: 'Branch network', problem: 'Clients wait in crowded branches.', solution: 'SMS call-up so clients can wait outside.' },
  { t: 'Shared document vault across branches', s: 'One secure vault so clients never resubmit the same ID documents.', sector: 'ICT', problem: 'Clients resubmit the same documents at each stage.', solution: 'A permissioned document vault.' },
  { t: 'Quarterly innovation hour', s: 'One protected hour per quarter for every team to test an improvement idea.', sector: 'Human Capital', problem: 'Staff have ideas but no time to test them.', solution: 'A ring-fenced innovation hour with a simple report-back.' },
];

const PARTNER: IdeaSeed[] = [
  { t: 'Campus innovation league', s: 'A league table that rewards university teams for solving local business problems.', sector: 'Education', problem: 'Students rarely work on real business problems.', solution: 'A season-long league with business-set challenges.' },
  { t: 'Maker-space booking for rural youth', s: 'Book time on 3D printers and laser cutters at regional hubs.', sector: 'Manufacturing', problem: 'Rural youth cannot reach maker equipment.', solution: 'A booking system and mobile maker van.' },
  { t: 'Open data portal for SMEs', s: 'Clean, downloadable data on markets and suppliers for small businesses.', sector: 'Digital services', problem: 'Market data is scattered and hard to use.', solution: 'A curated open data portal with simple charts.' },
  { t: 'Pitch-practice video coach', s: 'Record a pitch on your phone and get structured feedback from mentors.', sector: 'Education', problem: 'Founders get little practice before investor pitches.', solution: 'Video pitch submissions with mentor rubric feedback.' },
];

const NAMES = [
  'Boitumelo Kgosi', 'Onkemetse Tau', 'Lorato Segokgo', 'Katlego Mmusi', 'Pako Gaolathe', 'Wame Sekgoma', 'Bontle Morake', 'Amogelang Tlhalefang',
  'Refilwe Ditshwanelo', 'Kabelo Mosweu', 'Gaone Kgari', 'Mpho Tau', 'Oratile Sebina', 'Kefilwe Moagi', 'Tshepo Rantao', 'Lesedi Motsamai',
  'Goitseone Kebonang', 'Tumisang Pule', 'Dineo Mokgadi', 'Keabetswe Ramodimo', 'Itumeleng Mogapi', 'Botho Ngwako', 'Phenyo Kgathi', 'Kgomotso Sechele',
  'Larona Bogatsu', 'Thuso Molapisi', 'Omphile Mmolai',
];

const COMPANIES = ['Pty Ltd', 'Holdings', 'Ventures', 'Labs', 'Cooperative', 'Solutions'];

function iso(base: number, days: number, r: () => number = Math.random) {
  return new Date(base + days * DAY + Math.floor(r() * 7 * 3600_000)).toISOString();
}

export function createSeed(): State {
  const r = rng(20261119);
  const base = Date.now();
  const at = (d: number) => iso(base, d, r);
  const pw = (email: string) => hashPassword(email, DEMO_PASSWORD);
  const alerts = { inapp: true, email: true, sms: false };

  const demo: User[] = [
    { id: 'u_innovator', name: 'Kagiso Molefe', email: 'innovator@letsema.demo', phone: '+267 71 000 001', role: 'innovator', org: 'Molefe Agri Labs (Pty) Ltd', district: 'Gaborone', verified: true, passwordHash: pw('innovator@letsema.demo'), passkeys: [], createdAt: at(-120), consentAt: at(-120), alerts: { inapp: true, email: true, sms: true } },
    { id: 'u_reviewer', name: 'Dr Lesego Ntsima', email: 'reviewer@letsema.demo', role: 'reviewer', title: 'Agri-economist, external reviewer', verified: true, passwordHash: pw('reviewer@letsema.demo'), passkeys: [], createdAt: at(-200), consentAt: at(-200), alerts, expertise: ['Agriculture', 'Agro-processing', 'Livestock'] },
    { id: 'u_committee', name: 'Onalenna Dube', email: 'committee@letsema.demo', role: 'adjudicator', title: 'Chair, Innovation Committee', staff: true, verified: true, passwordHash: pw('committee@letsema.demo'), passkeys: [], createdAt: at(-300), consentAt: at(-300), alerts },
    { id: 'u_observer', name: 'Masego Phiri', email: 'observer@letsema.demo', role: 'observer', title: 'External committee member', org: 'Private-sector representative', verified: true, passwordHash: pw('observer@letsema.demo'), passkeys: [], createdAt: at(-150), consentAt: at(-150), alerts },
    { id: 'u_consultant', name: 'Thato Keabetswe', email: 'consultant@letsema.demo', role: 'consultant', title: 'Client service consultant', staff: true, verified: true, passwordHash: pw('consultant@letsema.demo'), passkeys: [], createdAt: at(-400), consentAt: at(-400), alerts },
    { id: 'u_admin', name: 'Neo Mothibi', email: 'admin@letsema.demo', role: 'admin', title: 'Innovation programme manager', staff: true, verified: true, passwordHash: pw('admin@letsema.demo'), passkeys: [], createdAt: at(-500), consentAt: at(-500), alerts },
  ];
  const reviewers: User[] = [
    { name: 'Kenosi Masilo', title: 'Fintech advisor (strict scorer)', exp: ['Fintech', 'Digital services', 'E-commerce'] },
    { name: 'Tebogo Lekoko', title: 'Energy engineer', exp: ['Energy', 'Water', 'Mobility'] },
    { name: 'Naledi Seleka', title: 'SME finance specialist (generous scorer)', exp: ['Agriculture', 'Waste', 'Creative'] },
    { name: 'Moagi Ramasedi', title: 'CEDA credit analyst', exp: ['Credit', 'ICT', 'Business Development'] },
  ].map((x, i) => ({
    id: `u_rev${i + 1}`, name: x.name, email: `rev${i + 1}@letsema.demo`, role: 'reviewer', title: x.title, verified: true,
    passwordHash: pw(`rev${i + 1}@letsema.demo`), passkeys: [], createdAt: at(-250), consentAt: at(-250), alerts, expertise: x.exp, staff: i === 3,
  }));
  const committee: User[] = ['Boikanyo Nkwe', 'Chedza Molosiwa'].map((n, i) => ({
    id: `u_com${i + 1}`, name: n, email: `com${i + 1}@letsema.demo`, role: 'adjudicator', title: 'Innovation Committee member', staff: true, verified: true,
    passwordHash: pw(`com${i + 1}@letsema.demo`), passkeys: [], createdAt: at(-300), consentAt: at(-300), alerts,
  }));
  const innovators: User[] = NAMES.map((n, i) => {
    const slug = n.toLowerCase().replace(/[^a-z]+/g, '.');
    return {
      id: `u_inn${i + 1}`, name: n, email: `${slug}@example.bw`, phone: `+267 7${(1000000 + i * 7919).toString().slice(0, 7)}`, role: 'innovator',
      org: `${n.split(' ')[1]} ${COMPANIES[i % COMPANIES.length]}`, district: DISTRICTS[i % DISTRICTS.length], verified: true,
      passwordHash: pw(`${slug}@example.bw`), passkeys: [], createdAt: at(-180 + i * 3), consentAt: at(-180 + i * 3), alerts: { inapp: true, email: true, sms: i % 3 === 0 },
      staff: false,
    };
  });
  const staffInnovators: User[] = ['Ame Lebotse', 'Ditiro Kgalemang', 'Sego Mokwena'].map((n, i) => ({
    id: `u_staff${i + 1}`, name: n, email: `staff${i + 1}@letsema.demo`, role: 'innovator', staff: true, org: 'CEDA (staff)', district: ['Gaborone', 'Francistown', 'Maun'][i], verified: true,
    passwordHash: pw(`staff${i + 1}@letsema.demo`), passkeys: [], createdAt: at(-365), consentAt: at(-365), alerts,
  }));

  const users = [...demo, ...reviewers, ...committee, ...innovators, ...staffInnovators];

  const mk = (p: Partial<Campaign> & Pick<Campaign, 'id' | 'slug' | 'title' | 'track' | 'host' | 'summary' | 'brief' | 'status' | 'opens' | 'closes'>): Campaign => ({
    themes: [], awardPool: 500000, maxAward: 150000,
    eligibility: ['Citizen-owned company registered with CIPA', 'More than 50% owned by citizens aged 18–35', 'Operating in, or launching in, Botswana'],
    criteria: DEFAULT_CRITERIA, form: DEFAULT_FORM,
    documents: [
      { id: 'pitch', name: 'Pitch deck or concept note', required: true, accept: '.pdf,.pptx', maxMb: 10 },
      { id: 'cipa', name: 'CIPA company extract', required: true, accept: '.pdf', maxMb: 5 },
      { id: 'budget', name: 'Budget (use the template)', required: false, accept: '.xlsx,.pdf', maxMb: 5 },
    ],
    levels: { screening: true, reviewersPerIdea: 2, disagreementThreshold: 18, committeeQuorum: 3 },
    hue: 160, createdAt: at(-90), updatedAt: at(-30),
    ...p,
  });

  const campaigns: Campaign[] = [
    mk({ id: 'c_agri', slug: 'youth-agritech-2026', title: 'Youth Agritech Challenge 2026', track: 'public', host: 'CEDA', status: 'open', opens: at(-21), closes: at(12), hue: 145, awardPool: 600000, maxAward: 150000,
      summary: 'Ideas that help farmers grow more, waste less and reach better markets.',
      brief: 'Botswana imports much of its food. We want youth-led ideas that raise productivity on small farms, add value to local produce, or connect farmers to buyers. Winning ideas receive funding in milestone-linked tranches, a mentor, and a place in the CEDA venture pipeline.',
      themes: ['Productivity', 'Value addition', 'Market access', 'Water'] }),
    mk({ id: 'c_green', slug: 'green-economy-2026', title: 'Green Economy & Climate Innovation', track: 'public', host: 'CEDA', status: 'reviewing', opens: at(-75), closes: at(-12), hue: 95, awardPool: 800000, maxAward: 200000,
      summary: 'Clean energy, recycling and climate-resilience businesses.',
      brief: 'Businesses that cut emissions, turn waste into value, or help communities cope with drought and heat. Submissions are closed; reviews and committee votes are under way.',
      themes: ['Clean energy', 'Circular economy', 'Water security'] }),
    mk({ id: 'c_digital', slug: 'digital-smes-2026', title: 'Digital Services for Small Businesses', track: 'public', host: 'CEDA', status: 'closed', opens: at(-200), closes: at(-140), hue: 205, awardPool: 450000, maxAward: 150000,
      summary: 'Software that helps micro and small enterprises run and grow.',
      brief: 'Closed call. Awarded teams are now delivering milestones, with funding released as each milestone is verified.',
      themes: ['Records & finance', 'Market access', 'Service delivery'] }),
    mk({ id: 'c_inside', slug: 'inside-ceda-2026', title: 'Inside CEDA: Faster, Fairer Service', track: 'staff', host: 'CEDA (staff only)', status: 'open', opens: at(-14), closes: at(30), hue: 25, awardPool: 0, maxAward: 0,
      summary: 'Staff ideas that make CEDA quicker, simpler and fairer for clients.',
      brief: 'An internal campaign for CEDA employees. The best ideas get a sponsor from the executive team, a pilot budget and recognition at the staff awards.',
      themes: ['Turnaround time', 'Client communication', 'Internal efficiency'],
      eligibility: ['Open to all CEDA employees', 'Ideas may be submitted alone or in teams'],
      criteria: STAFF_CRITERIA, form: STAFF_FORM, documents: [],
      levels: { screening: false, reviewersPerIdea: 2, disagreementThreshold: 20, committeeQuorum: 3 } }),
    mk({ id: 'c_partner', slug: 'innovation-day-pitch-2026', title: 'Innovation Day Pitch Track', track: 'partner', host: 'Partner space (demo)', status: 'open', opens: at(-10), closes: at(20), hue: 265, awardPool: 150000, maxAward: 50000,
      summary: 'A partner-run call hosted on the same platform, with its own criteria and committee.',
      brief: 'Shows how a partner organisation can run its own call on Letsema with its own form, criteria and reviewers, while CEDA keeps oversight and one audit trail.',
      themes: ['Skills', 'Digital', 'Maker economy'] }),
    mk({ id: 'c_tourism', slug: 'tourism-creative-2027', title: 'Tourism & Creative Industries 2027', track: 'public', host: 'CEDA', status: 'draft', opens: at(40), closes: at(100), hue: 330,
      summary: 'Draft call being prepared by the programme team.',
      brief: 'Draft. Not visible to the public until published.',
      themes: ['Experiences', 'Crafts', 'Film & music'] }),
  ];

  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]!;
  let refN = 101;
  const ideas: Idea[] = [];

  const reviewerPool = (c: Campaign) => (c.id === 'c_inside' ? ['u_rev4', 'u_reviewer', 'u_rev1'] : ['u_reviewer', 'u_rev1', 'u_rev2', 'u_rev3', 'u_rev4']);
  const leniency: Record<string, number> = { u_reviewer: 0, u_rev1: -0.9, u_rev2: 0.1, u_rev3: 0.8, u_rev4: -0.2 };

  const makeReview = (c: Campaign, reviewerId: string, quality: number, round: number, when: string): Review => {
    const scores: Record<string, number> = {};
    const comments: Record<string, string> = {};
    for (const cr of c.criteria) {
      const v = Math.round(quality + leniency[reviewerId]! + (r() - 0.5) * 1.4);
      scores[cr.id] = Math.max(1, Math.min(5, v));
      comments[cr.id] = COMMENTS[scores[cr.id]! - 1]!(cr.name.toLowerCase());
    }
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / c.criteria.length;
    return {
      id: `rv_${reviewerId}_${refN}_${round}`, reviewerId, round, scores, comments,
      overall: avg >= 3.8 ? 'Strong, well-evidenced idea. Recommend it goes to committee.' : avg >= 2.8 ? 'Promising, but the numbers and the customer evidence need work.' : 'The idea needs a clearer problem and a realistic plan before it can be supported.',
      recommendation: avg >= 3.6 ? 'advance' : avg >= 2.6 ? 'revise' : 'decline',
      submittedAt: when,
    };
  };

  function build(c: Campaign, seed: IdeaSeed, ownerId: string, status: Status, ageDays: number, quality: number) {
    const id = `i_${refN}`;
    const ref = `LTS-26-${String(refN).padStart(4, '0')}`;
    const created = at(-ageDays - 3);
    const t0 = -ageDays;
    const owner = users.find((u) => u.id === ownerId)!;
    const answers: Record<string, string> = {};
    for (const f of c.form) {
      if (f.id === 'problem') answers[f.id] = seed.problem;
      else if (f.id === 'solution') answers[f.id] = seed.solution;
      else if (f.id === 'customers') answers[f.id] = 'Direct sales to users, with a lower price for cooperatives and a partner channel through existing retailers.';
      else if (f.id === 'stage') answers[f.id] = pick(f.options!);
      else if (f.id === 'jobs') answers[f.id] = String(3 + Math.floor(r() * 25));
      else if (f.id === 'ask') answers[f.id] = String(Math.round((40000 + r() * (c.maxAward - 40000 || 100000)) / 1000) * 1000);
      else if (f.id === 'youth') answers[f.id] = 'yes';
      else if (f.id === 'saving') answers[f.id] = String(20 + Math.floor(r() * 300));
      else if (f.id === 'dept') answers[f.id] = seed.sector;
      else if (f.id === 'website') answers[f.id] = '';
    }
    const idea: Idea = {
      id, ref, campaignId: c.id, ownerId, team: r() > 0.5 ? [pick(NAMES)] : [], title: seed.t, summary: seed.s, sector: seed.sector,
      district: owner.district ?? pick(DISTRICTS), answers,
      attachments: status === 'draft' ? [] : c.documents.filter((d) => d.required).map((d) => ({ id: `${id}_${d.id}`, name: `${d.name.split(' ')[0]!.toLowerCase()}-${ref}.pdf`, size: 200_000 + Math.floor(r() * 2_000_000), type: 'application/pdf', sha256: sha256(`${id}${d.id}`), docId: d.id })),
      status: 'draft', round: 1, versions: [], assignments: [], reviews: [], thread: [], milestones: [], history: [], watchers: [],
      showcase: false, cheers: Math.floor(r() * 40), createdAt: created, updatedAt: created,
    };
    refN++;
    const push = (s: Status, d: number, by: string, note?: string) => {
      const h: HistoryItem = { at: at(d), status: s, by, note };
      idea.history.push(h);
      idea.status = s;
      idea.updatedAt = h.at;
    };
    const committeeIds = ['u_committee', 'u_com1', 'u_com2'];
    const v1 = () => idea.versions.push({ n: 1, at: at(t0), title: idea.title, summary: idea.summary, answers: { ...answers }, note: 'First submission' });
    if (status === 'draft') { idea.history.push({ at: created, status: 'draft', by: ownerId, note: 'Draft started' }); ideas.push(idea); return idea; }
    v1();
    push('submitted', t0, ownerId, 'Submitted with signed receipt');
    if (status === 'submitted') { ideas.push(idea); return idea; }
    if (c.levels.screening) push('screening', t0 + 1, 'u_admin', 'Picked up for screening');
    if (status === 'screening') { ideas.push(idea); return idea; }
    if (c.levels.screening) idea.screening = { by: 'u_admin', at: at(t0 + 2), passed: true, checks: { complete: true, eligible: true, documents: true }, note: 'Complete and eligible.' };
    const pool = reviewerPool(c);
    const rvIds = [pool[refN % pool.length]!, pool[(refN + 2) % pool.length]!];
    if (refN % 4 === 0 && c.id !== 'c_inside') rvIds.push(pool[(refN + 1) % pool.length]!);
    const uniq = [...new Set(rvIds)];
    idea.assignments = uniq.map((rid) => ({ reviewerId: rid, assignedAt: at(t0 + 2), dueAt: at(t0 + 12), conflict: { declared: false, at: at(t0 + 3) } }));
    push('in_review', t0 + 2, 'u_admin', `Assigned to ${uniq.length} reviewers`);
    const reviewedDay = Math.min(t0 + 9, -1);
    if (status === 'in_review') {
      // partially reviewed
      if (r() > 0.4) idea.reviews.push(makeReview(c, uniq[0]!, quality, 1, at(reviewedDay)));
      ideas.push(idea); return idea;
    }
    for (const rid of uniq) idea.reviews.push(makeReview(c, rid, quality, 1, at(reviewedDay)));
    const fb = (d: number, body: string) => idea.thread.push({ id: `m_${id}_${idea.thread.length}`, authorId: 'u_admin', body, at: at(d), visibility: 'shared', kind: 'feedback' } as Message);
    if (status === 'revision') {
      fb(reviewedDay + 1, 'Thank you. Reviewers liked the idea but asked for two things before committee: (1) evidence from at least 10 farmers that they would pay, and (2) a simpler budget showing unit cost per device. Please reply here with any questions and resubmit when ready.');
      push('revision', reviewedDay + 1, 'u_admin', 'Returned for revision with feedback');
      ideas.push(idea); return idea;
    }
    if (status === 'declined' && quality < 2.8) {
      fb(reviewedDay + 1, 'Thank you for entering. The reviewers found the problem important, but the plan is not yet ready for funding. Detailed comments are on each criterion. You are welcome to enter future calls.');
      push('declined', reviewedDay + 1, 'u_committee', 'Below threshold after review');
      ideas.push(idea); return idea;
    }
    push('committee', reviewedDay + 1, 'u_admin', 'Scores complete; sent to committee');
    if (status === 'committee') {
      const votes: Record<string, 'approve' | 'revise' | 'decline'> = {};
      if (r() > 0.5) votes['u_com1'] = quality > 3.4 ? 'approve' : 'revise';
      if (Object.keys(votes).length) idea.decision = { by: '', at: '', outcome: 'approve', rationale: '', votes };
      ideas.push(idea); return idea;
    }
    const votes: Record<string, 'approve' | 'revise' | 'decline'> = {};
    for (const cid of committeeIds) votes[cid] = status === 'declined' ? 'decline' : 'approve';
    const decided = reviewedDay + 4;
    if (status === 'declined') {
      idea.decision = { by: 'u_committee', at: at(decided), outcome: 'decline', rationale: 'Scored below the funding line for this call. Strong team; encouraged to re-apply with customer evidence.', votes };
      fb(decided, 'The committee did not select this idea in this round. See the criterion comments for what would strengthen a future application.');
      push('declined', decided, 'u_committee', 'Committee decision');
      ideas.push(idea); return idea;
    }
    idea.decision = { by: 'u_committee', at: at(decided), outcome: 'approve', rationale: 'High calibrated score, clear market evidence and a credible team. Approved for funding.', votes };
    push('approved', decided, 'u_committee', 'Approved by committee (3 of 3 votes)');
    if (status === 'approved') { ideas.push(idea); return idea; }
    const amount = Math.min(c.maxAward || 0, Number(answers.ask ?? 100000)) || 0;
    idea.award = { amount, at: at(decided + 3), code: sha256(`award:${ref}:${amount}`).slice(0, 12).toUpperCase() };
    push('awarded', decided + 3, 'u_admin', amount ? `Award confirmed: P${amount.toLocaleString('en-BW')}` : 'Recognised at staff awards');
    idea.showcase = true;
    if (status === 'awarded') { ideas.push(idea); return idea; }
    const tr = Math.round(amount / 4);
    const ms: Milestone[] = [
      { id: `${id}_m1`, title: 'Company bank account and mentor agreement', due: at(decided + 14), tranche: tr, status: 'verified', evidence: 'Mentor agreement signed' },
      { id: `${id}_m2`, title: 'Working pilot with first 20 customers', due: at(decided + 60), tranche: tr, status: refN % 2 ? 'verified' : 'evidence', evidence: refN % 2 ? 'Pilot report and customer list' : 'Pilot report uploaded, awaiting verification' },
      { id: `${id}_m3`, title: 'Break-even month', due: at(decided + 120), tranche: tr, status: 'in_progress' },
      { id: `${id}_m4`, title: 'Scale to second district', due: at(decided + 180), tranche: amount - 3 * tr, status: 'planned' },
    ];
    idea.milestones = ms;
    push('development', decided + 10, 'u_admin', 'Milestone plan agreed; first tranche released');
    ideas.push(idea);
    return idea;
  }

  const owners = innovators.map((u) => u.id);
  let o = 0;
  const nextOwner = () => owners[o++ % owners.length]!;

  // Youth Agritech (open)
  build(campaigns[0]!, AGRI[0]!, 'u_innovator', 'revision', 16, 3.3);
  const plan: [Status, number, number][] = [
    ['submitted', 2, 3], ['submitted', 1, 3.4], ['submitted', 0, 2.7], ['screening', 4, 3.1], ['screening', 3, 3.5],
    ['in_review', 9, 3.9], ['in_review', 8, 3.2], ['in_review', 7, 2.9], ['in_review', 10, 4.2],
  ];
  plan.forEach(([s, a, q], i) => build(campaigns[0]!, AGRI[i + 1]!, nextOwner(), s, a, q));
  // Green economy (reviewing)
  const gplan: [Status, number, number][] = [
    ['committee', 30, 4.1], ['committee', 28, 3.7], ['committee', 29, 3.4], ['in_review', 20, 3.5], ['in_review', 18, 3.0],
    ['revision', 25, 3.0], ['declined', 32, 2.2], ['in_review', 15, 3.8],
  ];
  gplan.forEach(([s, a, q], i) => build(campaigns[1]!, GREEN[i]!, nextOwner(), s, a, q));
  build(campaigns[1]!, GREEN[8]!, 'u_innovator', 'committee', 31, 3.9);
  // Digital SMEs (closed, in delivery)
  build(campaigns[2]!, DIGITAL[0]!, 'u_innovator', 'development', 150, 4.3);
  const dplan: [Status, number, number][] = [
    ['development', 148, 4.0], ['development', 147, 3.9], ['awarded', 146, 3.8], ['approved', 145, 3.7], ['declined', 150, 2.1], ['declined', 149, 3.0], ['declined', 151, 2.4],
  ];
  dplan.forEach(([s, a, q], i) => build(campaigns[2]!, DIGITAL[i + 1]!, nextOwner(), s, a, q));
  // Inside CEDA (staff)
  const iplan: [Status, number, number, string][] = [
    ['committee', 10, 4.2, 'u_staff1'], ['in_review', 7, 3.6, 'u_staff2'], ['in_review', 6, 3.1, 'u_staff3'], ['submitted', 2, 3, 'u_staff1'], ['submitted', 1, 3, 'u_staff2'], ['approved', 12, 4.0, 'u_staff3'],
  ];
  iplan.forEach(([s, a, q, ow], i) => build(campaigns[3]!, INSIDE[i]!, ow, s, a, q));
  // Partner track
  const pplan: [Status, number, number][] = [['submitted', 3, 3], ['submitted', 2, 3], ['in_review', 6, 3.6], ['submitted', 1, 3]];
  pplan.forEach(([s, a, q], i) => build(campaigns[4]!, PARTNER[i]!, nextOwner(), s, a, q));
  // A draft for the demo innovator
  build(campaigns[0]!, { t: 'Goat-milk cheese micro-dairy', s: 'A micro-dairy turning goat milk from Kweneng farmers into soft cheese for hotels.', sector: 'Agro-processing', problem: 'Goat milk is rarely sold because there is no local processor.', solution: '' }, 'u_innovator', 'draft', 1, 3);

  // Innovator replied on their revision thread
  const rev = ideas.find((i) => i.ownerId === 'u_innovator' && i.status === 'revision')!;
  rev.thread.push({ id: `m_${rev.id}_r1`, authorId: 'u_innovator', body: 'Thank you. I have started a survey with farmers in Kgatleng and will add the results and a per-device cost breakdown. Is a WhatsApp survey acceptable as evidence?', at: at(-3), visibility: 'shared', kind: 'reply' });
  rev.thread.push({ id: `m_${rev.id}_r2`, authorId: 'u_admin', body: 'Yes. Screenshots or an export of the responses are fine. Please include the number of respondents.', at: at(-2), visibility: 'shared', kind: 'feedback' });
  rev.thread.push({ id: `m_${rev.id}_n1`, authorId: 'u_reviewer', body: 'Internal: if the evidence comes back strong I would move my score on market from 3 to 4.', at: at(-2), visibility: 'internal', kind: 'note' });
  rev.watchers.push({ contact: '+267 71 000 001', channel: 'sms', at: at(-15) });

  const conversations: Conversation[] = [];
  const topics = ['Application form', 'Eligibility', 'Documents', 'Funding amounts', 'Password reset', 'Status of my idea', 'Technical problem'];
  for (let i = 0; i < 46; i++) {
    const day = -Math.floor(r() * 45) - 1;
    const start = new Date(base + day * DAY);
    start.setUTCHours(7 + Math.floor(r() * 9), Math.floor(r() * 60));
    const missed = r() < 0.18;
    const wait = 15 + Math.floor(r() * 240);
    const s = start.toISOString();
    conversations.push({
      id: `ch_${i}`, visitorName: pick(NAMES), topic: pick(topics), status: missed ? 'missed' : 'closed', agentId: missed ? undefined : 'u_consultant', startedAt: s,
      firstResponseAt: missed ? undefined : new Date(start.getTime() + wait * 1000).toISOString(),
      closedAt: new Date(start.getTime() + (wait + 300 + r() * 900) * 1000).toISOString(),
      rating: missed ? undefined : 3 + Math.floor(r() * 3),
      messages: missed
        ? [{ from: 'visitor', body: 'Hello, is anyone available?', at: s }, { from: 'system', body: 'Our consultants are not available at the moment (after hours). Live chat runs 09:00–16:00 on working days.', at: s }]
        : [{ from: 'visitor', body: 'Hi, I have a question about my application.', at: s }, { from: 'agent', agentId: 'u_consultant', body: 'Dumela! Happy to help. What would you like to know?', at: new Date(start.getTime() + wait * 1000).toISOString() }],
    });
  }
  conversations.push({ id: 'ch_live1', visitorName: 'Boitumelo Kgosi', visitorId: 'u_inn1', topic: 'Documents', status: 'waiting', startedAt: new Date(base - 3 * 60000).toISOString(), messages: [{ from: 'visitor', body: 'Dumela, can I upload my CIPA extract as a photo instead of a PDF?', at: new Date(base - 3 * 60000).toISOString() }] });
  conversations.push({ id: 'ch_live2', visitorName: 'Lorato Segokgo', visitorId: 'u_inn3', topic: 'Eligibility', status: 'active', agentId: 'u_consultant', startedAt: new Date(base - 9 * 60000).toISOString(), firstResponseAt: new Date(base - 8 * 60000).toISOString(), messages: [
    { from: 'visitor', body: 'My co-founder is 36. Can we still apply?', at: new Date(base - 9 * 60000).toISOString() },
    { from: 'agent', agentId: 'u_consultant', body: 'Yes, as long as citizens aged 18–35 own more than 50% of the company. How are the shares split?', at: new Date(base - 8 * 60000).toISOString() },
  ] });

  return {
    schema: SCHEMA,
    seededAt: new Date(base).toISOString(),
    users,
    campaigns,
    ideas,
    notifications: [
      { id: 'n1', userId: 'u_innovator', at: at(-2), title: 'New feedback on SoilSense', body: 'The programme team replied to your question.', link: `/app/ideas/${rev.id}`, read: false },
      { id: 'n2', userId: 'u_innovator', at: at(-6), title: 'Milestone verified', body: 'Milestone 1 on your Digital Services award was verified. Tranche released.', read: true },
      { id: 'n3', userId: 'u_reviewer', at: at(-1), title: 'New ideas assigned', body: 'You have ideas waiting in your review queue.', link: '/app/review', read: false },
    ],
    outbox: [],
    audit: [],
    conversations,
    pages: [
      { id: 'p_about', slug: 'about', title: 'About Letsema', updatedAt: at(-20), body: 'Letsema is the Setswana word for people ploughing together. This portal brings CEDA, innovators, reviewers and partners onto one field: ideas come in, are judged fairly and openly, and the best ones are funded and grown.\n\nIt serves two audiences: citizens and youth-owned companies entering public calls, and CEDA staff improving the Agency from the inside.' },
      { id: 'p_terms', slug: 'terms', title: 'Terms of use', updatedAt: at(-60), body: 'Use this portal honestly. Submit only work you have the right to submit. Ideas are shared only with the people who need to see them to evaluate them.' },
    ],
    faqs: [
      { id: 'f1', category: 'Applying', q: 'Who can apply to public calls?', a: 'Citizen-owned companies where citizens aged 18–35 own more than 50% of the shares. Each call lists its own extra rules on its page.' },
      { id: 'f2', category: 'Applying', q: 'Can I save my application and finish later?', a: 'Yes. Drafts save automatically on your device and in your account, even if your connection drops.' },
      { id: 'f3', category: 'Applying', q: 'Which fields are compulsory?', a: 'Fields marked with a star. The form will not let you submit until every compulsory field and required document is in place, and it shows you exactly what is missing.' },
      { id: 'f4', category: 'Evaluation', q: 'Who scores my idea?', a: 'At least two independent reviewers who have declared they have no conflict of interest. They score your idea without seeing your name or company. The committee then votes.' },
      { id: 'f5', category: 'Evaluation', q: 'What is a calibrated score?', a: 'Some reviewers score harder than others. Calibration adjusts for each reviewer’s habit so you are not disadvantaged by who you were assigned to.' },
      { id: 'f6', category: 'Evaluation', q: 'Can I respond to feedback?', a: 'Yes. Reply in the feedback thread on your idea. If the reviewers ask for a revision you can resubmit, and they will see exactly what you changed.' },
      { id: 'f7', category: 'Tracking', q: 'How do I know where my idea is?', a: 'Your idea page shows each stage: submission, review, feedback, approval, award and develop. You can also track it without signing in using your reference number, and get free alerts by email or SMS.' },
      { id: 'f8', category: 'Account', q: 'I forgot my password.', a: 'Use “Forgot password” on the sign-in page. We send a one-time code to your verified email or phone.' },
      { id: 'f9', category: 'Account', q: 'Can I sign in with my fingerprint or face?', a: 'Yes. After signing in, add a passkey in your profile. Your phone or laptop then signs you in with fingerprint, face or PIN.' },
      { id: 'f10', category: 'Privacy', q: 'What happens to my data?', a: 'It is used only to run the call you entered, kept only as long as the retention schedule says, and you can download or ask us to delete it from your profile at any time (Data Protection Act, 2024).' },
      { id: 'f11', category: 'Support', q: 'When is live chat available?', a: '09:00 to 16:00, Monday to Friday, except public holidays. Outside those hours you can leave a message and we reply on the next working day.' },
      { id: 'f12', category: 'Funding', q: 'How is award money paid?', a: 'In tranches linked to milestones you agree with CEDA. Each verified milestone releases the next tranche.' },
    ],
    documents: [
      { id: 'd1', name: 'Application guide 2026.pdf', size: 482_113, type: 'application/pdf', sha256: sha256('guide'), purpose: 'Guide for applicants', uploadedAt: at(-30) },
      { id: 'd2', name: 'Budget template.xlsx', size: 38_400, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', sha256: sha256('budget'), purpose: 'Template to accompany applications', uploadedAt: at(-30) },
      { id: 'd3', name: 'Youth Agritech Challenge - call document.pdf', size: 921_007, type: 'application/pdf', sha256: sha256('agri'), campaignId: 'c_agri', purpose: 'Call document', uploadedAt: at(-21) },
    ],
    notices: [
      { id: 'nt1', title: 'Youth Agritech Challenge closes soon', body: 'Submit before the deadline. Drafts are saved as you type.', tone: 'info', active: true, at: at(-2) },
    ],
    settings: {
      theme: { preset: 'letsema', primary: '#0b6b5c', accent: '#e8a33d', ink: '#11201c', paper: '#f6f4ee', font: 'Plus Jakarta Sans', radius: 14 },
      chat: { open: '09:00', close: '16:00', days: [1, 2, 3, 4, 5], maxPerAgent: 4 },
      retentionMonths: { applications: 84, chat: 12, audit: 84, declined: 24 },
      roles: DEFAULT_ROLES,
      webhooks: [{ id: 'wh1', url: 'https://crm.example.ceda.internal/hooks/letsema', events: ['idea.status_changed', 'idea.awarded'], active: false }],
    },
    privacy: [
      { id: 'pr1', userId: 'u_inn7', kind: 'export', at: at(-4), status: 'done' },
      { id: 'pr2', userId: 'u_inn12', kind: 'correct', at: at(-1), status: 'open', note: 'Wrong district on profile' },
    ],
    otps: [],
  };
}

const COMMENTS: ((c: string) => string)[] = [
  (c) => `Very weak on ${c}. Needs a fundamentally clearer case.`,
  (c) => `Below expectations on ${c}; key evidence is missing.`,
  (c) => `Adequate on ${c}, with gaps that should be addressed.`,
  (c) => `Good on ${c}; clear and reasonably evidenced.`,
  (c) => `Excellent on ${c}. Convincing and specific.`,
];
