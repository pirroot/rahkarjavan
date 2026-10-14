'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
  content: unknown;
  onChange: (json: unknown) => void;
};

function legacyToHtml(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string')
    return value
      .split(/\n{2,}/)
      .map((p) => `<p>${p}</p>`)
      .join('');
  if (value && typeof value === 'object') {
    const blocks = (value as { blocks?: Array<{ text?: string }> }).blocks;
    if (Array.isArray(blocks)) return blocks.map((b) => `<p>${b.text ?? ''}</p>`).join('');
  }
  return '';
}

const btn =
  'grid size-8 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white';

export default function RichEditor({ content, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      Placeholder.configure({
        placeholder: 'متن مقاله را بنویسید… تصویر هم می‌توانید بکشید و رها کنید',
      }),
    ],
    content:
      (content as { type?: string })?.type === 'doc' ? (content as object) : legacyToHtml(content),
    editorProps: {
      attributes: { dir: 'rtl', class: 'prose-editor min-h-[320px] px-4 py-3 focus:outline-none' },
      handleDrop: (_view, event, _slice, moved) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith('image/')) return moved;
        event.preventDefault();
        void insertUploadedImage(file);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getJSON()),
  });

  // eslint-disable-next-line react-hooks/refs
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    const json = content as { type?: string };
    if (json?.type === 'doc') editor.commands.setContent(json as object);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  async function insertUploadedImage(file: File) {
    setUploading(true);
    try {
      const res = await fetch(`/api/upload?kind=image&filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'آپلود ناموفق بود');
      editorRef.current?.chain().focus().setImage({ src: data.url, alt: file.name }).run();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'آپلود تصویر ناموفق بود');
    } finally {
      setUploading(false);
    }
  }

  if (!editor) return <div className="min-h-[320px] animate-pulse rounded-xl bg-white/5" />;

  const active = (name: string, attrs?: { level?: number }) =>
    attrs ? editor.isActive(name, attrs) : editor.isActive(name);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1420]">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#101823] px-2 py-2">
        <button
          type="button"
          title="بولد"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btn} ${active('bold') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          title="ایتالیک"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btn} ${active('italic') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          title="خط‌خورده"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${btn} ${active('strike') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Strikethrough size={15} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title="تیتر بزرگ"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btn} ${active('heading', { level: 2 }) ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          title="تیتر کوچک"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btn} ${active('heading', { level: 3 }) ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Heading3 size={15} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title="لیست نقطه‌ای"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btn} ${active('bulletList') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          title="لیست شماره‌ای"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btn} ${active('orderedList') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          title="نقل‌قول"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btn} ${active('blockquote') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          title="کد"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${btn} ${active('code') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Code size={15} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title="درج تصویر"
          onClick={() => fileRef.current?.click()}
          className={`${btn} ${uploading ? 'animate-pulse bg-brand-red/20 text-brand-red' : ''}`}
        >
          <ImagePlus size={15} />
        </button>
        <button
          type="button"
          title="لینک"
          onClick={() => {
            const url = window.prompt('نشانی لینک (خالی = حذف لینک):');
            if (url === null) return;
            if (url === '') return editor.chain().focus().unsetLink().run();
            editor.chain().focus().setLink({ href: url }).run();
          }}
          className={`${btn} ${active('link') ? 'bg-brand-red/20 text-brand-red' : ''}`}
        >
          <Link2 size={15} />
        </button>
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          title="واگرد"
          onClick={() => editor.chain().focus().undo().run()}
          className={btn}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          title="دوباره"
          onClick={() => editor.chain().focus().redo().run()}
          className={btn}
        >
          <Redo2 size={15} />
        </button>

        {uploading && (
          <span className="mr-auto text-xs font-bold text-brand-red">در حال آپلود تصویر…</span>
        )}
        {active('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="mr-auto inline-flex items-center gap-1 rounded bg-white/5 px-2 py-1 text-[11px] text-slate-400 hover:text-brand-red"
          >
            <X size={11} /> حذف لینک
          </button>
        )}
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void insertUploadedImage(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
