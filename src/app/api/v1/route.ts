export const dynamic = 'force-static';

/** Self-describing index of the partner API. */
export function GET() {
  return Response.json({
    name: 'CEDA Innovation Portal API',
    version: 1,
    auth: 'Authorization: Bearer <key>. Admins create keys in Look and settings. A key tied to a partner space only sees that space.',
    endpoints: [
      { method: 'GET', path: '/api/v1/instances', auth: false, about: 'Live and closed competitions with their stages, rubric and prizes.' },
      { method: 'GET', path: '/api/v1/entries?instance=<slug>&status=<status>', auth: true, about: 'Submitted applications: reference, title, status, sector, district, score, rank, award. No personal data.' },
      { method: 'GET', path: '/api/audit/verify', auth: false, about: 'Checks the audit trail chain is unbroken and returns its head fingerprint.' },
      { method: 'GET', path: '/api/health', auth: false, about: 'Uptime and database round trip.' },
    ],
  });
}
