// LatexRenderer.tsx
import { renderLatex } from '../components/latexRender';

interface CustomQuillProps {
  value: string;
  readOnly?: boolean;
}

export const CustomQuill = ({ value, readOnly = false }: CustomQuillProps) => {
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