declare module 'react-katex' {
  import { ReactNode } from 'react';

  export interface KaTeXProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => ReactNode;
    onError?: (error: Error) => void;
    children?: ReactNode;
  }

  export const InlineMath: React.FC<KaTeXProps>;
  export const BlockMath: React.FC<KaTeXProps>;
}
