import { caraBelajarPwn } from './cara-belajar-pwn';
import { introCtf } from './intro-ctf';
import { awesomeCtfTools } from './awesome-ctf-tools';
import { aiParadoxCtf } from './ai-paradox-ctf';
import { buangLanggananGpt } from './buang-langganan-gpt';
import { claudeVsGptVsKimiCtf } from './claude-vs-gpt-vs-kimi-ctf';
import { rsaCtfGuide } from './rsa-ctf-guide';
import { BlogPost } from '../blogTypes';

// Export individual posts for direct access
export { caraBelajarPwn } from './cara-belajar-pwn';
export { introCtf } from './intro-ctf';
export { awesomeCtfTools } from './awesome-ctf-tools';
export { aiParadoxCtf } from './ai-paradox-ctf';
export { buangLanggananGpt } from './buang-langganan-gpt';
export { claudeVsGptVsKimiCtf } from './claude-vs-gpt-vs-kimi-ctf';
export { rsaCtfGuide } from './rsa-ctf-guide';

// List of all blog posts, sorted by date descending (newest first)
export const blogPosts: BlogPost[] = [
  rsaCtfGuide,
  claudeVsGptVsKimiCtf,
  buangLanggananGpt,
  aiParadoxCtf,
  awesomeCtfTools,
  caraBelajarPwn,
  introCtf
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
