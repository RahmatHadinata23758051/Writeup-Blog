import React from 'react';
import type { BlogPost } from '../../data/blogTypes';
import { RichText } from '../docs/RichText';
import { BlogComments } from '../docs/BlogComments';
import { ArrowLeft, Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface DocsBlogPostPageProps {
  post: BlogPost;
  posts: BlogPost[];
  onPostClick: (id: string) => void;
  onBackClick: () => void;
}

export function DocsBlogPostPage({ post, posts, onPostClick, onBackClick }: DocsBlogPostPageProps) {
  // Find index of current post to determine next/prev posts
  const currentIndex = posts.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBackClick}
          className="group inline-flex items-center gap-2 rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Blog</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-4 border-b border-[var(--docs-border-soft)] pb-8">
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-5 text-sm font-mono text-[var(--docs-text-soft)]">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {post.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {post.readTime}
          </span>
          <span className="flex items-center gap-1.5">
            <User size={14} />
            Written by {post.author}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold font-display text-[var(--docs-text)] tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg font-serif text-[var(--docs-text-muted)] leading-relaxed italic font-light pt-1">
            {post.excerpt}
          </p>
        )}

        {/* Tags Row */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[var(--docs-surface)] px-2.5 py-0.5 text-xs font-sans font-medium text-[var(--docs-text-soft)] border border-[var(--docs-border-soft)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {/* Article Body Content */}
      <article className="prose-container">
        <RichText text={post.content} className="leading-relaxed" />
      </article>

      {/* Comments Section */}
      <BlogComments postId={post.id} />

      {/* Article Navigation Footer */}
      <footer className="border-t border-[var(--docs-border-soft)] pt-8 mt-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Previous Post */}
          {prevPost ? (
            <button
              onClick={() => {
                onPostClick(prevPost.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex flex-col items-start gap-2 rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 p-4 text-left transition-all hover:border-[var(--docs-accent-border)] hover:bg-[var(--docs-bg-soft)]/40 cursor-pointer"
            >
              <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-soft)]">
                <ChevronLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                Sebelumnya
              </span>
              <span className="text-sm font-bold font-display text-[var(--docs-text)] line-clamp-1 group-hover:text-[var(--docs-accent)] transition-colors">
                {prevPost.title}
              </span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {/* Next Post */}
          {nextPost ? (
            <button
              onClick={() => {
                onPostClick(nextPost.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex flex-col items-end gap-2 rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 p-4 text-right transition-all hover:border-[var(--docs-accent-border)] hover:bg-[var(--docs-bg-soft)]/40 cursor-pointer"
            >
              <span className="flex items-center gap-1 text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--docs-text-soft)]">
                Selanjutnya
                <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="text-sm font-bold font-display text-[var(--docs-text)] line-clamp-1 group-hover:text-[var(--docs-accent)] transition-colors">
                {nextPost.title}
              </span>
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      </footer>
    </div>
  );
}
