import { saveCampaign } from '../../core/actions';
import type { Campaign, User } from '../../core/types';
import { DAY, uid } from '../../core/util';
import { toast } from '../../ui/kit';

export function blankCampaign(): Campaign {
  const id = uid('c');
  return {
    id, slug: '', title: 'New call for ideas', track: 'public', host: 'CEDA', summary: 'One-line description shown on the call card.', brief: 'Describe what you are looking for and what winners receive.',
    themes: [], opens: new Date().toISOString(), closes: new Date(Date.now() + 30 * DAY).toISOString(), status: 'draft', awardPool: 300000, maxAward: 100000,
    eligibility: ['Citizen-owned company registered with CIPA', 'More than 50% owned by citizens aged 18–35'],
    criteria: [
      { id: uid('k'), name: 'Problem & need', description: 'Is the problem real and evidenced?', weight: 25 },
      { id: uid('k'), name: 'Innovation', description: 'How new is it?', weight: 25 },
      { id: uid('k'), name: 'Feasibility', description: 'Can the team deliver?', weight: 25 },
      { id: uid('k'), name: 'Impact', description: 'Jobs and citizen benefit', weight: 25 },
    ],
    form: [
      { id: 'problem', label: 'What problem are you solving?', type: 'textarea', required: true, maxLength: 1200 },
      { id: 'solution', label: 'What is your solution?', type: 'textarea', required: true, maxLength: 1500 },
    ],
    documents: [{ id: uid('d'), name: 'Pitch deck', required: true, accept: '.pdf,.pptx', maxMb: 10 }],
    levels: { screening: true, reviewersPerIdea: 2, disagreementThreshold: 18, committeeQuorum: 3 },
    hue: Math.floor(Math.random() * 360), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

export function attemptSave(me: User): string | undefined {
  try { const c = blankCampaign(); saveCampaign(me, c); toast('Draft call created'); return c.id; } catch (e) { toast((e as Error).message, 'err'); return undefined; }
}

export { saveCampaign };
