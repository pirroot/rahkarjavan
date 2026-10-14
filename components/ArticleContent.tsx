import Image from 'next/image';
import Link from 'next/link';

type DocNode = {
  type?: string;
  text?: string;
  marks?: Array<{ type: string; attrs?: { href?: string } }>;
  attrs?: { level?: number; src?: string; alt?: string };
  content?: DocNode[];
  blocks?: unknown[]; // ← اضافه: legacy format
};

/**
 * Renders TipTap JSON (or legacy {blocks:[{text}]}) as real news typography:
 * headings, images (next/image), lists, quotes, links.
 */
export default function ArticleContent({ value }: { value: unknown }) {
  if (!value) return null;

  // Legacy plain-text fallback
  if (typeof value === 'string') {
    return (
      <div className="article-body">
        {value.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  const doc = value as DocNode;

  // Legacy {blocks:[{text}]} from the old seed
  if (Array.isArray(doc.blocks)) {
    return (
      <div className="article-body">
        {(doc.blocks as Array<{ text?: string }>).map((b, i) =>
          typeof b?.text === 'string' ? <p key={i}>{b.text}</p> : null
        )}
      </div>
    );
  }

  if (doc.type !== 'doc' || !Array.isArray(doc.content)) return null;

  return <div className="article-body">{doc.content.map(renderNode)}</div>;
}

function renderNode(node: DocNode, key?: React.Key): React.ReactNode {
  if (!node) return null;
  const children = node.content?.map((child, i) => renderNode(child, i));

  switch (node.type) {
    case 'paragraph':
      return children?.length ? <p key={key}>{children}</p> : null;
    case 'heading': {
      const level = node.attrs?.level === 3 ? 3 : 2;
      return level === 2 ? <h2 key={key}>{children}</h2> : <h3 key={key}>{children}</h3>;
    }
    case 'image':
      return node.attrs?.src ? (
        <figure key={key} className="my-6">
          <span className="relative block aspect-video overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
            <Image
              src={node.attrs.src}
              alt={node.attrs.alt ?? ''}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </span>
          {node.attrs.alt && (
            <figcaption className="mt-2 text-center text-xs text-gray-500">
              {node.attrs.alt}
            </figcaption>
          )}
        </figure>
      ) : null;
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'orderedList':
      return <ol key={key}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'text': {
      let out: React.ReactNode = node.text ?? '';
      for (const mark of node.marks ?? []) {
        if (mark.type === 'bold') out = <strong key={`b-${String(key)}`}>{out}</strong>;
        else if (mark.type === 'italic') out = <em key={`i-${String(key)}`}>{out}</em>;
        else if (mark.type === 'strike') out = <s key={`s-${String(key)}`}>{out}</s>;
        else if (mark.type === 'code') out = <code key={`c-${String(key)}`}>{out}</code>;
        else if (mark.type === 'link' && mark.attrs?.href)
          out = (
            <Link
              key={`l-${String(key)}`}
              href={mark.attrs.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {out}
            </Link>
          );
      }
      return out;
    }
    default:
      return children ?? null;
  }
}
