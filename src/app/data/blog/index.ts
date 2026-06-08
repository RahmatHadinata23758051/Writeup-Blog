import { caraBelajarPwn } from './cara-belajar-pwn';
import { introCtf } from './intro-ctf';
import { BlogPost } from '../blogTypes';

// Export individual posts for direct access
export { caraBelajarPwn } from './cara-belajar-pwn';
export { introCtf } from './intro-ctf';

// List of all blog posts, sorted by date descending (newest first)
export const blogPosts: BlogPost[] = [
  caraBelajarPwn,
  introCtf
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
