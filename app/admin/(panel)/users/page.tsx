import UsersAdmin from '@/components/admin/UsersAdmin';
import { getSession, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (!isAdmin(session)) redirect('/');

  return <UsersAdmin currentUserId={session.id} />;
}
