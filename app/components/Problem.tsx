import { useState , useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import dynamic from 'next/dynamic';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

function renderLatex(text: string) {
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


const CustomQuill = ({ value, readOnly = false }) => {
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

type ProblemProps = {
  problem: {
    id: string;
    content: string;
    hint?: string;
  } | null;
  selectedDate: moment.Moment;
  isBookmarked: boolean;
  currentRating: 'easy' | 'medium' | 'hard' | null;
  isBookmarkLoading: boolean;
  onToggleBookmark: () => void;
  onRateQuestion: (rating: 'easy' | 'medium' | 'hard') => void;
  currentNote: string;
  onSaveNote: (note: string) => void;
  isSaving: boolean;
};

export const Problem: React.FC<ProblemProps> = ({
  problem,
  selectedDate,
  isBookmarked,
  currentRating,
  isBookmarkLoading,
  onToggleBookmark,
  onRateQuestion,
  currentNote,
  onSaveNote,
  isSaving
}) => {
  const [showHint, setShowHint] = useState(false);
  const [localNote, setLocalNote] = useState(currentNote);

  useEffect(() => {
    setLocalNote(currentNote);
  }, [currentNote,problem?.id]);

  const getDifficultyColor = (rating: 'easy' | 'medium' | 'hard') => {
    const colors = {
      easy: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      medium: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
      hard: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
    };
    return currentRating === rating ? colors[rating] : '';
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-3xl overflow-hidden ">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Problem for {selectedDate.format('MMMM D, YYYY')}</CardTitle>
            {problem && (
              <Button 
                onClick={onToggleBookmark}
                variant={isBookmarked ? "default" : "ghost"}
                size="sm"
                disabled={isBookmarkLoading}
                className={isBookmarked ? 'text-yellow-500 hover:text-yellow-600' : ''}
              >
                <BookmarkIcon className="w-4 h-4 mr-2" />
                {isBookmarkLoading ? 'Loading...' : (isBookmarked ? 'Bookmarked' : 'Bookmark')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {problem ? (
            <>
              <CustomQuill value={problem.content} readOnly={true} />
              {problem.hint && (
                <div className="mt-6 ">
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    variant="outline"
                    className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </Button>
                  {showHint && (
                    <div className="p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
                      <CustomQuill value={problem.hint} readOnly={true} />
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => onRateQuestion('easy')} 
                        variant="outline"
                        className={getDifficultyColor('easy')}
                      >
                        Easy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rate as Easy</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => onRateQuestion('medium')} 
                        variant="outline"
                        className={getDifficultyColor('medium')}
                      >
                        Medium
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rate as Medium</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => onRateQuestion('hard')} 
                        variant="outline"
                        className={getDifficultyColor('hard')}
                      >
                        Hard
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rate as Hard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Card className="mt-6 shadow-lg rounded-3xl overflow-hidden border border-gray-200">
  <CardHeader className="p-4 border-b border-gray-100">
    <CardTitle className="text-lg font-semibold text-gray-800">My Notes</CardTitle>
  </CardHeader>
  <CardContent className="p-4">
  <Textarea
    value={localNote}
    onChange={(e) => setLocalNote(e.target.value)}
    placeholder="Add your notes here..."
    rows={5}
    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
  />
  </CardContent>
  <CardFooter className="p-4 flex justify-end bg-gray-50">
    <Button
      onClick={() => onSaveNote(localNote)}
      disabled={isSaving}
      className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isSaving ? 'Saving...' : 'Save Note'}
    </Button>
  </CardFooter>
</Card>

            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No problem available for this date.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};