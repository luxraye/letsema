import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { AppLayout, PublicLayout, ThemeApplier } from './ui/layout';
import { applyPrefs, loadPrefs } from './ui/prefs';
import { Home } from './pages/public/Home';

// Public pages other than Home and every workspace page load on demand, so the first
// screen on a slow mobile connection only downloads what it needs.
const Calls = lazy(() => import('./pages/public/Calls'));
const CallDetail = lazy(() => import('./pages/public/CallDetail'));
const IdeaBank = lazy(() => import('./pages/public/IdeaBank'));
const Track = lazy(() => import('./pages/public/Track'));
const How = lazy(() => import('./pages/public/How'));
const Help = lazy(() => import('./pages/public/Help'));
const Status = lazy(() => import('./pages/public/Status'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const CmsPage = lazy(() => import('./pages/public/CmsPage'));
const Judges = lazy(() => import('./pages/public/Judges'));
const Verify = lazy(() => import('./pages/public/Verify'));
const Auth = lazy(() => import('./pages/public/Auth'));
const DemoInbox = lazy(() => import('./pages/public/DemoInbox'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const MyIdeas = lazy(() => import('./pages/app/MyIdeas'));
const IdeaEditor = lazy(() => import('./pages/app/IdeaEditor'));
const IdeaPassport = lazy(() => import('./pages/app/IdeaPassport'));
const ReviewQueue = lazy(() => import('./pages/app/ReviewQueue'));
const ReviewIdea = lazy(() => import('./pages/app/ReviewIdea'));
const Pipeline = lazy(() => import('./pages/app/Pipeline'));
const Reports = lazy(() => import('./pages/app/Reports'));
const ChatConsole = lazy(() => import('./pages/app/ChatConsole'));
const AdminCalls = lazy(() => import('./pages/app/AdminCalls'));
const CallBuilder = lazy(() => import('./pages/app/CallBuilder'));
const AdminContent = lazy(() => import('./pages/app/AdminContent'));
const AdminUsers = lazy(() => import('./pages/app/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/app/AdminSettings'));
const Audit = lazy(() => import('./pages/app/Audit'));
const PrivacyDesk = lazy(() => import('./pages/app/PrivacyDesk'));
const Profile = lazy(() => import('./pages/app/Profile'));

function Loading() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted" role="status">Loading…</div>;
}

export function App() {
  useEffect(() => { applyPrefs(loadPrefs()); }, []);
  return (
    <HashRouter>
      <ThemeApplier />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="calls" element={<Calls />} />
            <Route path="calls/:slug" element={<CallDetail />} />
            <Route path="ideas" element={<IdeaBank />} />
            <Route path="track" element={<Track />} />
            <Route path="track/:ref" element={<Track />} />
            <Route path="how" element={<How />} />
            <Route path="help" element={<Help />} />
            <Route path="status" element={<Status />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="page/:slug" element={<CmsPage />} />
            <Route path="judges" element={<Judges />} />
            <Route path="verify" element={<Verify />} />
            <Route path="login" element={<Auth mode="login" />} />
            <Route path="register" element={<Auth mode="register" />} />
            <Route path="forgot" element={<Auth mode="forgot" />} />
            <Route path="confirm/:userId" element={<Auth mode="confirm" />} />
            <Route path="inbox" element={<DemoInbox />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="ideas" element={<MyIdeas />} />
            <Route path="ideas/new" element={<IdeaEditor />} />
            <Route path="ideas/:id" element={<IdeaPassport />} />
            <Route path="ideas/:id/edit" element={<IdeaEditor />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="review/:id" element={<ReviewIdea />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="committee/:id" element={<IdeaPassport />} />
            <Route path="reports" element={<Reports />} />
            <Route path="chat" element={<ChatConsole />} />
            <Route path="admin/calls" element={<AdminCalls />} />
            <Route path="admin/calls/:id" element={<CallBuilder />} />
            <Route path="admin/content" element={<AdminContent />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/settings" element={<AdminSettings />} />
            <Route path="audit" element={<Audit />} />
            <Route path="privacy" element={<PrivacyDesk />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
