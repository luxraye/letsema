import { liveInstances } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await liveInstances();
  return Response.json({ data: rows.map(({ i, space, entries }) => ({
    slug: i.slug, name: i.name, space: space.slug, status: i.status, version: i.version, rulesHash: i.rulesHash, entries,
    kind: i.definition.kind, stages: i.definition.stages, rubric: i.definition.rubric.map(({ key, label, weight }) => ({ key, label, weight })), prizes: i.definition.prizes,
  })) });
}
