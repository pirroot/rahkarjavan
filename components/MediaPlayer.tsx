'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type MediaPlayerProps = {
  title: string;
  thumb: string;
  videoUrl?: string;
  duration?: string;
  category?: string;
  live?: boolean;
  /** Rounded corners variant used inside cards/hero */
  className?: string;
};

/**
 * Lazy player — zero video bytes until the user presses play.
 * The <video> element only mounts after the play click, so the source
 * is attached in an effect (the ref is null inside the click handler).
 */
export default function MediaPlayer({
  title,
  thumb,
  videoUrl,
  duration,
  category,
  live,
  className = '',
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // The source chosen at click-time — attached after the element mounts
  const pendingSrc = useRef<string | null>(null);

  function start() {
    if (!videoUrl) {
      setStatus('error');
      return;
    }
    pendingSrc.current = videoUrl; // remember for the effect
    setStarted(true); // mounts the <video> element
    setStatus('loading');
  }

  // ⭐ Runs after the video element is actually in the DOM
  useEffect(() => {
    if (!started) return;
    const video = videoRef.current;
    const src = pendingSrc.current;
    if (!video || !src) return;
    pendingSrc.current = null;

    const isHls = src.includes('.m3u8');
    const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');

    if (!isHls || nativeHls) {
      // MP4 anywhere, HLS natively on Safari
      video.src = src;
      video.play().catch(() => setStatus('error'));
      return;
    }

    // Chrome/Firefox/Android need hls.js for m3u8 — loaded on demand
    void import('hls.js').then(({ default: Hls }) => {
      const hls = new Hls({ maxBufferLength: 15, capLevelToPlayerSize: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setStatus('error');
      });
      video.play().catch(() => setStatus('error'));
    });
  }, [started]);

  return (
    <div className={`media-player ${className}`}>
      <div className="media-player__topbar">
        <span className="media-player__brand">
          <span className="media-player__status" /> رسانه تصویری راهکار جوان
        </span>
        <span className="media-player__quality">
          HD <span aria-hidden="true">·</span> نسبت ۱۶:۹
        </span>
      </div>

      <div className="media-player__screen">
        {!started ? (
          <>
            <Image
              src={thumb}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="media-player__poster"
            />
            <span className="media-player__shade absolute inset-0 bg-black/25" />
            {category && <span className="media-player__category">{category}</span>}
            {live && <span className="media-player__live">پخش زنده</span>}

            {/* Big play button — video bytes start flowing only after this tap */}
            <button
              type="button"
              onClick={start}
              aria-label={`پخش ${title}`}
              className="group/play absolute inset-0 grid place-items-center"
            >
              <span className="flex flex-col items-center gap-2">
                <span className="grid size-16 place-items-center rounded-full bg-brand-red/95 text-white shadow-2xl transition-transform duration-300 group-hover/play:scale-110 group-active/play:scale-95 md:size-20">
                  <Play size={30} fill="currentColor" aria-hidden className="translate-x-0.5" />
                </span>
                {!live && duration && (
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold tabular-nums text-white backdrop-blur-sm">
                    {duration}
                  </span>
                )}
              </span>
            </button>
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              controls
              playsInline
              preload="auto"
              poster={thumb}
              aria-label={`پخش ویدیو: ${title}`}
              className="media-player__video"
              onPlaying={() => setStatus('idle')}
              onError={() => setStatus('error')}
            />
            {status === 'loading' && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/55">
                <span className="h-11 w-11 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <span className="mt-3 text-xs text-white">در حال بارگذاری ویدیو…</span>
              </div>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 grid place-items-center bg-black/85 p-4 text-center text-sm text-white">
                پخش ویدیو ممکن نشد؛ اتصال اینترنت را بررسی کنید یا بعداً دوباره تلاش کنید.
              </div>
            )}
          </>
        )}
      </div>

      <div className="media-player__bottombar">
        <span>{live ? 'پخش زنده' : 'ویدیوی منتخب'}</span>
        <span className="media-player__duration">{duration}</span>
      </div>
    </div>
  );
}
