import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, FileTextIcon, VideoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import 'katex/dist/katex.min.css';
 
import { renderLatex } from './latexRender';

const CustomQuill: React.FC<{ value: string; readOnly?: boolean; preserveFormulas?: boolean }> = ({ value, readOnly = false, preserveFormulas = false }) => {
  if (preserveFormulas) {
    return (
      <div className="prose dark:prose-invert max-w-none">
        {renderLatex(value)}
      </div>
    );
  }
  
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
    wSolution?: string;
    vSolution?: string;
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
  const [isModified, setIsModified] = useState(false);
  const [selectedRating, setSelectedRating] = useState<'easy' | 'medium' | 'hard' | null>(null);

  useEffect(() => {
    setShowHint(false);
  }, [problem?.id]);
  
  useEffect(() => {
    setLocalNote(currentNote);
  }, [currentNote]);

  // Reset local state when problem changes
  useEffect(() => {
    setIsModified(false);
    setSelectedRating(null);
  }, [problem?.id]);

  // Function to get style for each difficulty button
  const getButtonStyle = (difficulty: 'easy' | 'medium' | 'hard') => {
    // Use the selected rating if it's set, otherwise use currentRating
    const activeRating = isModified ? selectedRating : currentRating;
    
    // Base style for all buttons
    const baseStyle = { 
      transition: 'all 0.2s ease'
    };
    
    // Styles for each difficulty when active
    const activeStyles = {
      easy: { 
        backgroundColor: 'rgba(34, 197, 94, 0.1)', 
        color: 'rgb(34, 197, 94)',
        fontWeight: 'bold' as const
      },
      medium: { 
        backgroundColor: 'rgba(249, 115, 22, 0.1)', 
        color: 'rgb(249, 115, 22)',
        fontWeight: 'bold' as const
      },
      hard: { 
        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
        color: 'rgb(239, 68, 68)',
        fontWeight: 'bold' as const
      }
    };
    
    // Return combined styles
    return activeRating === difficulty 
      ? { ...baseStyle, ...activeStyles[difficulty] } 
      : baseStyle;
  };

  // Handle button click with local state update first
  const handleRatingClick = (rating: 'easy' | 'medium' | 'hard') => {
    // Update local state for immediate feedback
    setSelectedRating(rating);
    setIsModified(true);
    
    // Call parent function
    onRateQuestion(rating);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg rounded-3xl overflow-hidden">
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
              
              <div className="mt-6 space-y-4">
                {/* Buttons Container */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                  {/* Difficulty Rating Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => handleRatingClick('easy')} 
                            variant="outline"
                            style={getButtonStyle('easy')}
                          >
                            Easy
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-md">
                          Rate as Easy
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => handleRatingClick('medium')} 
                            variant="outline"
                            style={getButtonStyle('medium')}
                          >
                            Medium
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-md">
                          Rate as Medium
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => handleRatingClick('hard')} 
                            variant="outline"
                            style={getButtonStyle('hard')}
                          >
                            Hard
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-md">
                          Rate as Hard
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
  
                  {/* Solution Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {problem.wSolution && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => window.open(problem.wSolution, '_blank')}
                              variant="outline"
                              className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                            >
                              <FileTextIcon className="w-4 h-4 mr-2" />
                              Written Solution
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-md">
                            View Written Solution
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
  
                    {problem.vSolution && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => window.open(problem.vSolution, '_blank')}
                              variant="outline"
                              className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                            >
                              <VideoIcon className="w-4 h-4 mr-2" />
                              Video Solution
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white border border-gray-200 shadow-md px-3 py-1.5 rounded-md">
                            Watch Video Solution
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
  
                {/* Hint Section */}
                {problem.hint && (
                  <div>
                    <Button
                      onClick={() => setShowHint(!showHint)}
                      variant="outline"
                      className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    {showHint && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-800 rounded-2xl">
                        <CustomQuill value={problem.hint} readOnly={true} preserveFormulas={true} />
                      </div>
                    )}
                  </div>
                )}
              </div>
  
              {/* Notes Card */}
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