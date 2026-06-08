import React, { useState, useMemo } from 'react';
import type { BlogPost } from '../../data/blogTypes';
import { Search, Calendar, Clock, Tag as TagIcon } from 'lucide-react';

interface DocsBlogListPageProps {
  posts: BlogPost[];
  onPostClick: (id: string) => void;
}

export function DocsBlogListPage({ posts, onPostClick }: DocsBlogListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags from all posts
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, [posts]);

  // Filter posts based on search query and selected tag
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !selectedTag || post.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [posts, searchQuery, selectedTag]);

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if clicked again
    } else {
      setSelectedTag(tag);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between border-b border-[var(--docs-border)] pb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📝</span>
          <h1 className="text-3xl font-bold font-display text-[var(--docs-text)] tracking-tighter">Blog</h1>
        </div>
      </div>

      <p className="text-lg font-serif text-[var(--docs-text-muted)] leading-relaxed max-w-2xl italic font-light">
        Catatan teknis, panduan belajar cybersecurity, opini, dan cerita seru seputar petualangan Capture The Flag (CTF).
      </p>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--docs-text-soft)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Cari artikel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 py-2 pl-10 pr-4 text-sm text-[var(--docs-text)] placeholder-[var(--docs-text-soft)] focus:border-[var(--docs-accent)] focus:bg-[var(--docs-bg-soft)]/45 focus:outline-none transition-colors"
          />
        </div>

        {/* Selected Tag Clear Badge */}
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="self-start sm:self-auto text-xs text-[var(--docs-accent)] hover:underline font-mono"
          >
            Clear filter ({selectedTag}) ×
          </button>
        )}
      </div>

      {/* Tags Cloud */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--docs-text-soft)] font-sans">
          <TagIcon size={12} />
          <span>Filter Kategori</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded px-3 py-1 text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--docs-accent)] bg-[var(--docs-accent-soft)] text-[var(--docs-accent)] font-semibold shadow-sm'
                    : 'border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/30 text-[var(--docs-text-muted)] hover:bg-[var(--docs-surface-hover)] hover:text-[var(--docs-text)]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 pt-4">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => onPostClick(post.id)}
              className="group flex flex-col justify-between rounded-lg border border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/20 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--docs-accent-border)] hover:bg-[var(--docs-bg-soft)]/45 cursor-pointer"
            >
              <div className="space-y-3">
                {/* Meta details */}
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--docs-text-soft)]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.readTime}
                  </span>
                </div>

                {/* Post Title */}
                <h2 className="text-xl font-bold font-display text-[var(--docs-text)] leading-tight group-hover:text-[var(--docs-accent)] transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-sm font-serif text-[var(--docs-text-muted)] leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              {/* Footer tags */}
              <div className="flex flex-wrap gap-1.5 pt-5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-[var(--docs-surface)] px-2 py-0.5 text-[10px] font-sans font-medium text-[var(--docs-text-soft)] border border-[var(--docs-border-soft)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 rounded border border-dashed border-[var(--docs-border-soft)] bg-[var(--docs-bg-soft)]/10">
          <p className="text-sm text-[var(--docs-text-muted)] font-serif italic">
            Tidak ada artikel yang cocok dengan pencarian atau filter kategori ini.
          </p>
        </div>
      )}
    </div>
  );
}
