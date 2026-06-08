export type WriteupDifficulty =
  | "Easy"
  | "Medium"
  | "Hard"
  | "Insane"
  | "Unknown"
  | string;

export type WriteupSolutionStep = {
  title?: string;
  content?: string;
  description?: string;
  code?: string;
  command?: string;
  output?: string;
};

export type WriteupTerminalOutput = {
  title?: string;
  command?: string;
  output: string;
};

export type MathFormula = {
  title?: string;
  formula: string;
  description?: string;
  variant?: 'default' | 'highlight' | 'subtle';
};

export type Writeup = {
  id: string;
  title: string;
  ctfName: string;
  category: string;

  difficulty?: WriteupDifficulty;
  points?: number | string;
  date?: string;
  author?: string;
  tags?: string[];

  description?: string;
  problemDescription?: string | string[];

  tools?: string[];

  analysis?: string | string[];

  solution?: string | string[] | WriteupSolutionStep[];

  terminalOutputs?: string | string[] | WriteupTerminalOutput[];

  flag?: string;

  lessonsLearned?: string | string[];

  // Support math visualization from legacy writeups
  mathAnalysis?: MathFormula[];
};
