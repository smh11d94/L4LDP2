import katex from 'katex';

export function renderLatex(text: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const rawText = (doc.body.textContent || '')
  .replace(/\\n/g, '\n')  // Replace \n with actual newlines
  .replace(/\n\s*\n/g, '\n\n');  // Normalize multiple newlines

  const katexConfig = {
    throwOnError: false,
    trust: true,
    strict: false,
    fontFamily: "'Latin Modern', serif",
    errorColor: '#cc0000',
    displayMode: true,
    fleqn: true,
    leqno: true,
    colorIsTextColor: true,
    maxSize: Infinity,
    maxExpand: 1000,
    globalGroup: true,
    macros: {
      "\\RR": "\\mathbb{R}",
      "\\NN": "\\mathbb{N}",
      "\\ZZ": "\\mathbb{Z}",
      "\\CC": "\\mathbb{C}",
      "\\QQ": "\\mathbb{Q}",
      "\\eps": "\\varepsilon",
      "\\d": "\\mathrm{d}",
      "\\dd": "\\mathrm{d}",
      "\\diff": "\\frac{\\d}{\\d x}",
      "\\difft": "\\frac{\\d}{\\d t}",
      "\\lap": "\\Delta",
      "\\grad": "\\nabla",
      "\\zbar": "\\overline{z}",
      "\\ud": "\\,\\mathrm{d}",
      "\\uint": "\\int\\limits",
      "\\usum": "\\sum\\limits",
      "\\umax": "\\max\\limits",
      "\\umin": "\\min\\limits",
      "\\norm": "\\left\\|#1\\right\\|",
      "\\abs": "\\left|#1\\right|",
      "\\set": "\\left\\{#1\\right\\}",
      "\\seq": "\\left(#1\\right)",
      "\\ceil": "\\left\\lceil#1\\right\\rceil",
      "\\floor": "\\left\\lfloor#1\\right\\rfloor",
      "\\paren": "\\left(#1\\right)",
      "\\eval": "\\left.#1\\right|",
      "\\bigO": "\\mathcal{O}",
      "\\dv": "\\frac{\\d #1}{\\d #2}",
      "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
      "\\vec": "\\mathbf{#1}",
      "\\mat": "\\mathbf{#1}",
      "\\formula": "\\displaystyle"
    }
  };

  if (rawText.includes('$') || rawText.includes('\\[') || rawText.includes('\\]') || 
      rawText.includes('\\(') || rawText.includes('\\text{')) {
    const lines = rawText.split(/\n/);
    const processedText = lines.join('\n');
    
    // Updated pattern to handle \text{} commands
    const parts = processedText.split(/((?:\\\[|\$\$)[\s\S]*?(?:\\\]|\$\$)|(?:\\\(|\$)[\s\S]*?(?:\\\)|\$)|\\textbf\{[^}]+\}|\\text\{[^}]+\})/g);

    return(
      <div className="latex-content text-lg font-['Latin Modern', serif]">
        {parts.map((part, index) => {
          // Handle \text{} commands
          if (part.startsWith('\\text{') && part.endsWith('}')) {
            const content = part.slice(6, -1);
            return <span key={index} className="text-lg">{content}</span>;
          }

          if (part.startsWith('\\textbf{') && part.endsWith('}')) {
            const content = part.slice(8, -1);
            return <span key={index} className="font-bold">{content}</span>;
          }

          if (part.startsWith('\\[') && part.endsWith('\\]')) {
            const latex = part.slice(2, -2).trim();
            katexConfig.displayMode = true;
            try {
              return (
                <div key={index} className="my-4 whitespace-normal overflow-x-auto" style={{
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  maxWidth: '100%'
                }} dangerouslySetInnerHTML={{
                  __html: katex.renderToString(latex, katexConfig)
                }}/>
              );
            } catch (error) {
              console.error('LaTeX error:', error);
              return <div key={index} className="text-red-500 my-4">{part}</div>;
            }
          } else if (part.startsWith('$$') && part.endsWith('$$')) {
            const latex = part.slice(2, -2).trim();
            katexConfig.displayMode = true;
            try {
              return (
                <div key={index} className="my-4" dangerouslySetInnerHTML={{
                  __html: katex.renderToString(latex, katexConfig)
                }}/>
              );
            } catch (error) {
              console.error('LaTeX error:', error);
              return <div key={index} className="text-red-500 my-4">{part}</div>;
            }
          } else if ((part.startsWith('$') && part.endsWith('$')) || 
                     (part.startsWith('\\(') && part.endsWith('\\)'))) {
            const latex = part.startsWith('$') ? part.slice(1, -1).trim() : part.slice(2, -2).trim();
            katexConfig.displayMode = false;
            try {
              return (
                <span key={index} className="inline" dangerouslySetInnerHTML={{
                  __html: katex.renderToString(latex, katexConfig)
                }}/>
              );
            } catch (error) {
              console.error('LaTeX error:', error);
              return <span key={index} className="text-red-500">{part}</span>;
            }
          }
          return part.trim() ? (
            <span key={index} className="whitespace-pre-line">{part}</span>
          ) : null;
        })}
      </div>
    );
  }
  return <div>{rawText}</div>;
}