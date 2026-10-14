import AdminSidebar from '@/components/AdminSidebar';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const displayName = session.name || session.email.split('@')[0];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        displayName={displayName}
        role={session.role === 'ADMIN' ? 'ADMIN' : 'AUTHOR'}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
