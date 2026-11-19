import { useParams } from 'react-router';
import { useStore, Empty } from '../../ui/kit';
import { fmtDate } from '../../core/util';
export default function CmsPage() {
  const { slug } = useParams();
  const s = useStore();
  const p = s.pages.find((x) => x.slug === slug);
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-16"><Empty title="Page not found" /></div>;
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{p.title}</h1>
      <p className="mt-1 text-sm text-muted">Last updated {fmtDate(p.updatedAt)}</p>
      <div className="mt-6 space-y-4 text-lg leading-relaxed">{p.body.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>
    </article>
  );
}
