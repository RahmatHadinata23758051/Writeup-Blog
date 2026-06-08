import type { Writeup } from './writeupTypes';

/**
 * Copyable writeup template for new CTF challenge entries.
 *
 * Usage:
 *   1. Copy this object into src/app/data/writeups.ts
 *   2. Replace all placeholder values with real data
 *   3. Follow the ID standard: eventslug-category-challengeslug
 *   4. Run `npm run build` to verify
 *
 * This file is an authoring reference only.
 * It should NOT be imported by runtime UI components.
 */
export const writeupTemplate: Writeup = {
  id: 'eventslug-category-challengeslug',
  title: 'Challenge Name',
  ctfName: 'ExampleCTF 2026',
  category: 'Web',
  difficulty: 'Medium',
  points: 500,
  date: '2026-06-08',
  author: 'rhnataiet23-art',
  tags: ['tag-1', 'tag-2'],

  description: 'Short TL;DR of the challenge solution.',

  problemDescription: `Paste the original challenge description here.`,

  tools: ['python', 'curl', 'burp-suite'],

  analysis: `Explain the initial observation, source review, file analysis, endpoint behavior, cryptographic weakness, or exploit idea.`,

  solution: [
    {
      title: 'Step 1 - Recon',
      content: 'Describe the first step.',
      command: 'curl -i https://example.com',
      output: 'HTTP/2 200',
    },
    {
      title: 'Step 2 - Exploit',
      content: 'Describe the exploitation step.',
      code: 'python3 solve.py',
    },
  ],

  terminalOutputs: [
    {
      title: 'Final solve',
      command: 'python3 solve.py',
      output: 'FLAG{example}',
    },
  ],

  flag: 'FLAG{example}',

  lessonsLearned: [
    'Write the important technique learned here.',
    'Write another practical note here.',
  ],
};
