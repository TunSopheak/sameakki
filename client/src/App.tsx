import { GuidePage } from './components/guide/GuidePage';
import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GroupBanner } from './components/GroupBanner';
import { DailyStandupBox } from './components/DailyStandupBox';
import { DailyFeed } from './components/DailyFeed';
import { TasksTab } from './components/TasksTab';
import { MembersList } from './components/MembersList';
import { OverviewDashboard } from './components/OverviewDashboard';
import { CreateGroupModal } from './components/CreateGroupModal';
import { JoinGroupModal } from './components/JoinGroupModal';
import { AngkorWatermark } from './components/AngkorWatermark';
import { MobileTabBar } from './components/MobileTabBar';
import { AdminOverview } from './components/AdminOverview';
import type { Tab } from './components/sidebar/SidebarNav';
import { Logo } from './components/Logo';
import { AssignTaskModal } from './components/AssignTaskModal';
import { AddMemberModal } from './components/AddMemberModal';
import { DeleteGroupModal } from './components/DeleteGroupModal';
import { LeaveGroupModal } from './components/LeaveGroupModal';
import { AssignmentReportModal } from './components/AssignmentReportModal';
import { AuthScreen } from './components/AuthScreen';
import { Notice } from './components/Notice';
import { SpecialtySuggestions } from './components/SpecialtyCell';
import { DemoBanner } from './components/DemoBanner';
import { PlanBanner } from './components/PlanBanner';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { setPagePreset, type PagePreset } from './lib/pagePreset';
import { hasLoggedInBefore, navigate, rememberLogin, useRoute } from './lib/route';
import { LandingPage } from './components/landing/LandingPage';
import { APP_NAME } from './lib/brand';
import { CelebrationLayer } from './components/CelebrationLayer';
import { APP_VERSION } from './lib/version';

const MainApp: React.FC = () => {
  const { currentUser, t } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleTabChange = (tab: Tab, preset?: Omit<PagePreset, 'page'>) => {
    // A page opened from a card starts filtered. Any other way of opening it starts clean.
    setPagePreset(preset && (tab === 'tasks' || tab === 'daily') ? { ...preset, page: tab } : null);
    if (tab === 'report') {
      setIsReportModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex text-black selection:bg-brand selection:text-white">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        onOpenAssignTask={() => setIsAssignTaskOpen(true)}
        onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <DemoBanner />
        <PlanBanner />
        <Header activeTab={activeTab} onNavigate={handleTabChange} />

        <main className="flex-1 pb-8 lg:pb-16">
          {activeTab !== 'admin' && activeTab !== 'guide' && (
            <GroupBanner
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
              onOpenAddMember={() => setIsAddMemberOpen(true)}
              onOpenDeleteGroup={id => setDeleteGroupId(id)}
              onOpenLeaveGroup={id => setLeaveGroupId(id)}
            />
          )}

          <div key={activeTab} className="animate-rise max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <DailyStandupBox onOpenGuide={() => handleTabChange('guide')} />

                <OverviewDashboard
                  onGoToTab={(tab, preset) => handleTabChange(tab, preset)}
                  onOpenAssignTask={() => setIsAssignTaskOpen(true)}
                  onOpenAddMember={() => setIsAddMemberOpen(true)}
                />
              </div>
            )}

            {activeTab === 'tasks' && (
              <TasksTab onOpenAssignTask={() => setIsAssignTaskOpen(true)} />
            )}

            {activeTab === 'daily' && (
              <div className="space-y-6">
                <DailyStandupBox onOpenGuide={() => handleTabChange('guide')} />
                <DailyFeed />
              </div>
            )}

            {activeTab === 'admin' && <AdminOverview />}

            {activeTab === 'guide' && <GuidePage />}

            {activeTab === 'members' && (
              <MembersList onOpenLeaveGroup={id => setLeaveGroupId(id)} />
            )}
          </div>
        </main>

        <footer className="border-t border-neutral-200 bg-white pb-24 pt-6 text-xs text-neutral-500 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/khmer/flag-of-cambodia.svg" alt="" width="24" height="15" className="flag-kh" />
              <span className="font-bold text-black">{APP_NAME}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 font-mono-numbers" title={t.versionLabel}>v{APP_VERSION}</span>
              <span>·</span>
              <span>
                {t.footerTagline}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                {currentUser.name} ({currentUser.email})
              </span>
            </div>
          </div>
        </footer>
      </div>

      <MobileTabBar activeTab={activeTab} onSelect={handleTabChange} onOpenMenu={() => setIsMobileSidebarOpen(true)} />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
      />

      <AssignTaskModal
        isOpen={isAssignTaskOpen}
        onClose={() => setIsAssignTaskOpen(false)}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />

      <DeleteGroupModal
        groupId={deleteGroupId}
        onClose={() => setDeleteGroupId(null)}
      />

      <LeaveGroupModal
        groupId={leaveGroupId}
        onClose={() => setLeaveGroupId(null)}
      />

      <AssignmentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <ForcePasswordChange />
      <SpecialtySuggestions />
      <Notice />
    </div>
  );
};

const SessionGate: React.FC = () => {
  const { status, t, isDemo } = useApp();
  const route = useRoute();

  // Remember this browser has logged in before
  useEffect(() => {
    if (status === 'ready' && !isDemo) rememberLogin();
  }, [status, isDemo]);

  // "/" shows login for returning users and the landing page for new ones
  const returning = hasLoggedInBefore();
  const showLogin = route === '/login' || (route === '/' && returning);
  useEffect(() => {
    if (status === 'signed_out' && route === '/' && returning) navigate('/login', { replace: true });
    if (status === 'ready' && route === '/login') navigate('/', { replace: true });
  }, [status, route, returning]);

  if (status === 'loading') {
    return (
      <div className="fade-late min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-neutral-600 text-sm gap-3">
        <Logo className="logo-breathe size-14 text-black" />
        <span>{t.loading}</span>
      </div>
    );
  }

  if (status === 'signed_out') {
    return (
      <>
        {showLogin ? <AuthScreen /> : <LandingPage />}
        <Notice />
      </>
    );
  }

  if (route === '/about') return <LandingPage />;

  return <MainApp />;
};

export default function App() {
  return (
    <AppProvider>
      <AngkorWatermark />
      <CelebrationLayer />
      <SessionGate />
    </AppProvider>
  );
}
