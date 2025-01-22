import katex from 'katex';

export function renderLatex(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const rawText = doc.body.textContent || '';

  if (rawText.includes('$') || rawText.includes('\\[') || rawText.includes('\\(')) {
    const parts = rawText.split(/(\\[\[\(].*?\\[\]\)]|\$.*?\$)/g);
    return <div>
      {parts.map((part, index) => {
        if (part.startsWith('\\[') || part.startsWith('\\(') || (part.startsWith('$') && part.endsWith('$'))) {
          const isDisplay = part.startsWith('\\[');
          const latex = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
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