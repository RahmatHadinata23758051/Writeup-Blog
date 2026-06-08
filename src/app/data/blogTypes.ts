export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  date: string;
  tags: string[];
  author: string;
  readTime: string;
  coverImage?: string;
}
