export type Category = 'Web' | 'Crypto' | 'Pwn' | 'Forensics' | 'Reverse' | 'OSINT' | 'Misc' | 'AI' | 'Malware Analysis' | 'Malware' | 'Mobile' | 'Hardware' | 'Blockchain' | 'Kubernetes' | 'Steganography' | string;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface MathFormula {
  title?: string;
  formula: string;
  description?: string;
  variant?: 'default' | 'highlight' | 'subtle';
}

export interface TerminalOutput {
  command: string;
  output: string;
}

export interface WriteUp {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  date: string;
  author: string;
  description: string;
  problemDescription: string;
  tools: string[];
  analysis: string;
  mathAnalysis?: MathFormula[];
  solution: {
    title: string;
    content: string;
    code?: string;
  }[];
  terminalOutputs?: TerminalOutput[];
  flag: string;
  lessonsLearned: string;
  ctfName: string;
}
