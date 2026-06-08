import { caraBelajarPwn } from './cara-belajar-pwn';
import { introCtf } from './intro-ctf';
import { awesomeCtfTools } from './awesome-ctf-tools';
import { aiParadoxCtf } from './ai-paradox-ctf';
import { BlogPost } from '../blogTypes';

// Export individual posts for direct access
export { caraBelajarPwn } from './cara-belajar-pwn';
export { introCtf } from './intro-ctf';
export { awesomeCtfTools } from './awesome-ctf-tools';
export { aiParadoxCtf } from './ai-paradox-ctf';

// List of all blog posts, sorted by date descending (newest first)
export const blogPosts: BlogPost[] = [
  aiParadoxCtf,
  awesomeCtfTools,
  caraBelajarPwn,
  introCtf
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
