// LatexRenderer.tsx
import katex from 'katex';

export function renderLatex(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const rawText = doc.body.textContent || '';

  if (rawText.includes('\\[') || rawText.includes('\\(')) {
    const parts = rawText.split(/(\\[\[\(].*?\\[\]\)])/g);
    return <div>
      {parts.map((part, index) => {
        if (part.startsWith('\\[') || part.startsWith('\\(')) {
          const isDisplay = part.startsWith('\\[');
          const latex = part.slice(2, -2);
          try {
            return <div key={index} className={isDisplay ? "my-4 text-center" : "inline"} 
              dangerouslySetInnerHTML={{ 
                __html: katex.renderToString(latex, {
                  displayMode: isDisplay,
                  throwOnError: false,
                  trust: true,
                  strict: false,
                  macros: {
                    "\\f": "f(#1)",
                    "\\diff": "\\frac{d}{dx}"
                  }
                })
              }} 
            />;
          } catch (error) {
            return <span key={index}>{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>;
  }
  return <div>{rawText}</div>;
}

export const CustomQuill = ({ value, readOnly = false }) => {
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