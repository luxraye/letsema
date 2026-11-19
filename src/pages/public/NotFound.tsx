import { LinkButton } from '../../ui/kit';
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="font-display text-6xl font-extrabold text-brand">404</div>
      <h1 className="mt-3 text-2xl font-bold">This page does not exist</h1>
      <p className="mt-2 text-muted">The link may be old, or you may not have access to it.</p>
      <LinkButton to="/" className="mt-6">Go to the home page</LinkButton>
    </div>
  );
}
