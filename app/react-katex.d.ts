declare module 'react-katex' {
    import { ComponentType, ReactNode } from 'react';
  
    interface KaTeXProps {
      math: string;
      block?: boolean;
      errorColor?: string;
      renderError?: (error: Error | TypeError) => ReactNode;
      settings?: any;
      as?: string | ComponentType<any>;
    }
  
    export const BlockMath: ComponentType<KaTeXProps>;
    export const InlineMath: ComponentType<KaTeXProps>;
  }