'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

export type CommentAuthor = { id: string; name: string };

export type CommentItem = {
  id: string;
  body: string;
  date: string;
  canDelete: boolean;
  author: CommentAuthor;
};

type Props = {
  newsId?: string;
  videoId?: string;
  initialComments: CommentItem[];
  signedIn: boolean;
};

const faDateTime = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' });

export default function CommentSection({ newsId, videoId, initialComments, signedIn }: Props) {
  const pathname = usePathname();
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel in-flight request on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Send the user back to this exact page after login
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') ?? '').trim();
    if (body.length < 2) return;

    setSubmitting(true);
    setError('');
    abortRef.current = new AbortController();

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, newsId, videoId }),
      signal: abortRef.current.signal,
    }).catch(() => null);

    if (!response) {
      setError('ارتباط با سرور برقرار نشد.');
      setSubmitting(false);
      return;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? 'ثبت نظر ممکن نشد.');
      setSubmitting(false);
      return;
    }

    // Build the item locally — never trust the API shape blindly
    const added = result?.comment;
    setComments((current) => [
      ...current,
      {
        id: String(added?.id ?? `tmp-${Date.now()}`),
        body: String(added?.body ?? body),
        date: String(added?.date ?? faDateTime.format(new Date())),
        canDelete: true, // it is the user's own comment
        author: {
          id: String(added?.author?.id ?? ''),
          name: String(added?.author?.name ?? 'کاربر'),
        },
      },
    ]);
    form.reset();
    setSubmitting(false);
  }

  async function remove(id: string) {
    if (!confirm('این نظر حذف شود؟')) return;
    setError('');
    const response = await fetch(`/api/comments/${id}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      const result = await response?.json().catch(() => null);
      setError(result?.error ?? 'حذف نظر ممکن نشد.');
      return;
    }
    setComments((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-8 dark:border-white/10">
      <h2 className="text-xl font-black">نظرها ({comments.length.toLocaleString('fa-IR')})</h2>

      <div className="mt-6 grid gap-4">
        {comments.length === 0 && <p className="text-sm text-gray-500">هنوز نظری ثبت نشده است.</p>}
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-brand-red/10 text-sm font-black text-brand-red">
                  {comment.author.name.slice(0, 1)}
                </span>
                <div>
                  <p className="font-bold">{comment.author.name}</p>
                  <p className="text-xs text-gray-500">{comment.date}</p>
                </div>
              </div>
              {comment.canDelete && (
                <button
                  type="button"
                  onClick={() => remove(comment.id)}
                  className="text-xs text-gray-400 transition hover:text-brand-red"
                >
                  حذف
                </button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-8 text-gray-700 dark:text-gray-200">
              {comment.body}
            </p>
          </article>
        ))}
      </div>

      {signedIn ? (
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <label className="grid gap-2 text-sm font-bold">
            نظر شما
            <textarea
              name="body"
              required
              minLength={2}
              maxLength={2000}
              rows={4}
              placeholder="دیدگاه خود را بنویسید…"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-brand-red dark:border-white/15 dark:bg-white/5"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-brand-red">
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            className="h-11 w-fit rounded-xl bg-brand-red px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? 'در حال ارسال…' : 'ارسال نظر'}
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5">
          برای ثبت نظر{' '}
          <Link href={loginHref} className="font-bold text-brand-red hover:underline">
            وارد شوید
          </Link>{' '}
          یا{' '}
          <Link
            href={`/register?next=${encodeURIComponent(pathname)}`}
            className="font-bold text-brand-red hover:underline"
          >
            ثبت‌نام کنید
          </Link>
          .
        </p>
      )}
    </section>
  );
}
