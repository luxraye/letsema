import { stopAlerts } from '@/app/actions/public';
export default async function Stop({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await stopAlerts(token);
  return <div className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="text-2xl font-bold">Alerts stopped</h1><p className="mt-2 text-muted">You will not get more updates for this application.</p></div>;
}
