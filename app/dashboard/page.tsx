'use client';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-primary flex-none">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-sm text-text-secondary mt-0.5">{label}</p>
        {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
      </div>
    </div>
  );
}

// ─── Activity Item ─────────────────────────────────────────────────────────────

function ActivityItem({ icon, text, time }: { icon: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className="text-xl flex-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text">{text}</p>
        <p className="text-xs text-text-muted mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Welcome back! 👋</h1>
        <p className="text-text-secondary text-sm mt-1">
          Here's what's happening with your profile today.
        </p>
      </div>

      {/* Profile Completion Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-5 mb-8 text-white flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-base">Complete your profile</p>
          <p className="text-white/75 text-sm mt-0.5">
            Profiles with photos get 3× more interest. Add yours now.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/30 max-w-[180px]">
              <div className="h-1.5 rounded-full bg-white w-[60%]" />
            </div>
            <span className="text-xs font-medium text-white/80">60% complete</span>
          </div>
        </div>
        <button className="flex-none px-4 py-2 bg-white text-primary text-sm font-semibold rounded-lg hover:bg-secondary transition-colors whitespace-nowrap">
          Add Photo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Profile Views"
          value="128"
          trend="+12 this week"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatCard
          label="Interests Received"
          value="24"
          trend="+3 new"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <StatCard
          label="Matches"
          value="7"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="Unread Messages"
          value="5"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text mb-1">Recent Activity</h2>
          <p className="text-xs text-text-muted mb-4">Latest interactions on your profile</p>
          <ActivityItem icon="💌" text="Priya S. sent you an interest" time="2 hours ago" />
          <ActivityItem icon="👀" text="Your profile was viewed 8 times" time="Today" />
          <ActivityItem icon="💍" text="New match: Kavitha R. from Chennai" time="Yesterday" />
          <ActivityItem icon="✅" text="Profile approved by admin" time="2 days ago" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text mb-1">Quick Actions</h2>
          <p className="text-xs text-text-muted mb-4">Jump to the most important tasks</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🔍', label: 'Browse Matches', href: '/dashboard/matches' },
              { icon: '📝', label: 'Edit Profile', href: '/dashboard/profile' },
              { icon: '💬', label: 'View Messages', href: '/dashboard/messages' },
              { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary transition-all text-sm font-medium text-text-secondary hover:text-primary"
              >
                <span className="text-lg">{a.icon}</span>
                {a.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
