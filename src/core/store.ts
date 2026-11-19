// Client-side store used by the open preview ("demo mode").
// - State persists in localStorage, so a judge's changes survive reloads.
// - Every tab is a separate session (sessionStorage), so you can be the innovator in
//   one tab and the reviewer in another and watch updates arrive live through
//   BroadcastChannel: the same event stream a production server would push over SSE.
// The production architecture swaps this module for an HTTP/SSE client; the
// action and rule modules stay the same.
import { createSeed, SCHEMA } from './seed';
import { sha256 } from './sha256';
import type { AuditEntry, State, User } from './types';
import { now } from './util';

const KEY = 'letsema:state:v3';
const SESSION = 'letsema:session';

type Listener = () => void;

function safeGet(storage: Storage | undefined, key: string): string | null {
  try { return storage?.getItem(key) ?? null; } catch { return null; }
}
function safeSet(storage: Storage | undefined, key: string, value: string) {
  try { storage?.setItem(key, value); } catch { /* storage may be blocked */ }
}

export const GENESIS = '0'.repeat(64);

export function auditHash(e: Omit<AuditEntry, 'hash'>): string {
  return sha256([e.seq, e.at, e.actorId, e.actorRole, e.action, e.target, e.detail, e.prevHash].join('|'));
}

export function verifyChain(audit: AuditEntry[]): { ok: boolean; brokenAt?: number; checked: number } {
  let prev = GENESIS;
  for (const e of audit) {
    if (e.prevHash !== prev || auditHash(e) !== e.hash) return { ok: false, brokenAt: e.seq, checked: audit.length };
    prev = e.hash;
  }
  return { ok: true, checked: audit.length };
}

export function appendAudit(state: State, actor: Pick<User, 'id' | 'role'> | null, action: string, target: string, detail: string, at = now()) {
  const prev = state.audit[state.audit.length - 1];
  const base = {
    seq: (prev?.seq ?? 0) + 1,
    at,
    actorId: actor?.id ?? 'system',
    actorRole: actor?.role ?? 'system',
    action,
    target,
    detail,
    prevHash: prev?.hash ?? GENESIS,
  };
  state.audit.push({ ...base, hash: auditHash(base) });
}

/** Build the initial audit chain from the seeded history, in time order. */
function seedAudit(state: State) {
  const events: { at: string; actor: string; action: string; target: string; detail: string }[] = [];
  for (const u of state.users) events.push({ at: u.createdAt, actor: u.id, action: 'user.registered', target: u.id, detail: `${u.role} account created and verified` });
  for (const c of state.campaigns) events.push({ at: c.createdAt, actor: 'u_admin', action: 'campaign.created', target: c.id, detail: c.title });
  for (const i of state.ideas) {
    for (const h of i.history) events.push({ at: h.at, actor: h.by, action: `idea.${h.status}`, target: i.ref, detail: h.note ?? '' });
    for (const rv of i.reviews) events.push({ at: rv.submittedAt, actor: rv.reviewerId, action: 'review.submitted', target: i.ref, detail: `Round ${rv.round}` });
  }
  events.sort((a, b) => a.at.localeCompare(b.at));
  for (const e of events) {
    const u = state.users.find((x) => x.id === e.actor);
    appendAudit(state, u ? { id: u.id, role: u.role } : { id: e.actor, role: 'system' }, e.action, e.target, e.detail, e.at);
  }
}

export function freshState(): State {
  const s = createSeed();
  seedAudit(s);
  return s;
}

class Store {
  state: State;
  version = 0;
  sessionUserId: string | null;
  private listeners = new Set<Listener>();
  private channel: BroadcastChannel | null = null;
  lastRemote: { at: number; action: string } | null = null;

  constructor() {
    const raw = typeof localStorage !== 'undefined' ? safeGet(localStorage, KEY) : null;
    let parsed: State | null = null;
    if (raw) {
      try { parsed = JSON.parse(raw) as State; } catch { parsed = null; }
    }
    this.state = parsed && parsed.schema === SCHEMA ? parsed : freshState();
    if (!parsed) this.persist();
    this.sessionUserId = typeof sessionStorage !== 'undefined' ? safeGet(sessionStorage, SESSION) : null;
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('letsema');
      this.channel.onmessage = (ev) => {
        const raw2 = safeGet(localStorage, KEY);
        if (!raw2) return;
        try {
          this.state = JSON.parse(raw2);
          this.lastRemote = { at: Date.now(), action: String(ev.data?.action ?? 'update') };
          this.bump();
        } catch { /* ignore */ }
      };
    }
  }

  private persist() {
    if (typeof localStorage !== 'undefined') safeSet(localStorage, KEY, JSON.stringify(this.state));
  }

  private bump() {
    this.version++;
    for (const l of this.listeners) l();
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  getVersion = () => this.version;

  /** Apply a change, persist it, and broadcast it to every other open tab. */
  commit(action: string, mutate: (s: State) => void) {
    mutate(this.state);
    this.persist();
    this.channel?.postMessage({ action, at: Date.now() });
    this.bump();
  }

  setSession(userId: string | null) {
    this.sessionUserId = userId;
    try {
      if (userId) sessionStorage.setItem(SESSION, userId);
      else sessionStorage.removeItem(SESSION);
    } catch { /* ignore */ }
    this.bump();
  }

  get me(): User | undefined {
    return this.state.users.find((u) => u.id === this.sessionUserId && !u.disabled);
  }

  reset() {
    this.state = freshState();
    this.persist();
    this.channel?.postMessage({ action: 'reset', at: Date.now() });
    this.bump();
  }
}

export const store = new Store();
