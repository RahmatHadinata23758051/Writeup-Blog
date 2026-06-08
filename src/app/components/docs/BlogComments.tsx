import React, { useEffect, useRef } from 'react';

interface BlogCommentsProps {
  postId: string;
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear previous comments before rendering new ones (for client-side routing)
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'RahmatHadinata23758051/Writeup-Blog');
    script.setAttribute('issue-term', postId);  // unique per post, works with hash routing
    script.setAttribute('theme', 'github-light');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    containerRef.current?.appendChild(script);
  }, [postId]);

  return (
    <div className="mt-12 border-t border-[var(--docs-border-soft)] pt-8">
      <h3 className="text-xl font-bold font-display text-[var(--docs-text)] mb-4">
        Diskusi & Komentar
      </h3>
      <p className="text-xs text-[var(--docs-text-muted)] mb-6">
        Masuk menggunakan GitHub untuk berdiskusi atau memberikan tanggapan mengenai artikel ini.
      </p>
      <div ref={containerRef} className="utterances-container min-h-[200px]" />
    </div>
  );
}
