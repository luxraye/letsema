import { ussdReply } from '@/lib/ussd';

/** USSD gateway callback. Accepts the usual form fields (sessionId, phoneNumber, text) or JSON. */
export async function POST(req: Request) {
  let text = '';
  const type = req.headers.get('content-type') ?? '';
  if (type.includes('json')) text = String((await req.json().catch(() => ({}))).text ?? '');
  else text = String((await req.formData().catch(() => new FormData())).get('text') ?? '');
  const reply = await ussdReply(text.slice(0, 200));
  return new Response(reply, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
