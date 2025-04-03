// LatexRenderer.tsx
import { renderLatex } from '../components/latexRender';

interface CustomQuillProps {
  value: string;
  readOnly?: boolean;
  preserveFormulas?: boolean;
}

export const CustomQuill = ({ value, readOnly = false, preserveFormulas = false }: CustomQuillProps) => {
  // If preserveFormulas is true, we'll process the entire content as a single block
  if (preserveFormulas) {
    return (
      <div className="prose dark:prose-invert max-w-none">
        {renderLatex(value)}
      </div>
    );
  }
  
  // Otherwise, process line by line (original behavior)
  return (
    <div className="prose dark:prose-invert max-w-none">
      {value.split('\n').map((line, i) => (
        <div key={i} className="mb-4">
          {renderLatex(line)}
        </div>
      ))}
    </div>
  );
};

// You can also export renderLatex if you want to make it available through this file
export { renderLatex };