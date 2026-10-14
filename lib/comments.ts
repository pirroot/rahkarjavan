import { prisma } from '@/lib/prisma';
import { isAdmin, type SessionUser } from '@/lib/auth';
import type { CommentItem } from '@/components/CommentSection';

export async function getContentComments(
  filter: { newsId: string } | { videoId: string },
  session: SessionUser | null
): Promise<CommentItem[]> {
  try {
    const comments = await prisma.comment.findMany({
      where: filter,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(
        comment.createdAt
      ),
      canDelete: isAdmin(session) || comment.authorId === session?.id,
      author: comment.author,
    }));
  } catch {
    return [];
  }
}
