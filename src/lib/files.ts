/** Pre-flight checks on uploaded files: real type from magic bytes, size, PDF pages, leaked secrets. */
export function sniff(buf: Buffer): string {
  const h = buf.subarray(0, 8);
  if (h.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (h[0] === 0x50 && h[1] === 0x4b && h[2] === 0x03 && h[3] === 0x04) return 'zip';
  if (h[0] === 0x89 && h.subarray(1, 4).toString('latin1') === 'PNG') return 'png';
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return 'jpg';
  if (h[0] === 0x4d && h[1] === 0x5a) return 'exe';
  if (h[0] === 0x7f && h.subarray(1, 4).toString('latin1') === 'ELF') return 'exe';
  const sample = buf.subarray(0, 4096);
  if (sample.every((b) => b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127) || b >= 128)) return 'text';
  return 'unknown';
}

const EXT_TYPES: Record<string, string[]> = { pdf: ['pdf'], pptx: ['zip'], docx: ['zip'], xlsx: ['zip'], zip: ['zip'], png: ['png'], jpg: ['jpg'], jpeg: ['jpg'], txt: ['text'], md: ['text'], csv: ['text'] };

export function pdfPages(buf: Buffer) {
  const m = buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : null;
}

const SECRET_PATTERNS: [string, RegExp][] = [
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['API token', /\b(sk|pk|ghp|xox[bap])[-_][A-Za-z0-9]{20,}/],
  ['password in text', /password\s*[:=]\s*\S{6,}/i],
];

export type FileCheck = { status: 'pass' | 'warn' | 'fail'; detail: string; detected: string; pages: number | null };

export function checkFile(name: string, buf: Buffer, rule: { accept?: string[]; maxMb?: number; maxPages?: number }): FileCheck {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const detected = sniff(buf);
  const pages = detected === 'pdf' ? pdfPages(buf) : null;
  if (detected === 'exe') return { status: 'fail', detail: 'This is a program, not a document. It was blocked.', detected, pages };
  if (rule.accept?.length && !rule.accept.includes(ext)) return { status: 'fail', detail: `Only ${rule.accept.join(', ').toUpperCase()} files are accepted here.`, detected, pages };
  const expect = EXT_TYPES[ext];
  if (expect && !expect.includes(detected)) return { status: 'fail', detail: `The file says .${ext} but its contents are ${detected}. Please upload the real file.`, detected, pages };
  const mb = buf.length / 1048576;
  if (rule.maxMb && mb > rule.maxMb) return { status: 'fail', detail: `File is ${mb.toFixed(1)} MB; the limit is ${rule.maxMb} MB.`, detected, pages };
  if (rule.maxPages && pages && pages > rule.maxPages) return { status: 'fail', detail: `The PDF has ${pages} pages; the limit is ${rule.maxPages}.`, detected, pages };
  const text = detected === 'text' || detected === 'pdf' ? buf.toString('latin1') : '';
  for (const [label, re] of SECRET_PATTERNS) if (re.test(text)) return { status: 'warn', detail: `Looks like it contains a ${label}. Remove it before sharing your work.`, detected, pages };
  return { status: 'pass', detail: `${detected.toUpperCase()}${pages ? `, ${pages} page${pages > 1 ? 's' : ''}` : ''}, ${(buf.length / 1024).toFixed(0)} KB`, detected, pages };
}
