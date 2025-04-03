import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, FileTextIcon, VideoIcon, FileEdit, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import 'katex/dist/katex.min.css';
import React from 'react';
 
import { renderLatex } from './latexRender';

// Create a class to prevent text selection
const noSelectClass = "select-none";

const CustomQuill: React.FC<{ value: string; readOnly?: boolean; preserveFormulas?: boolean; preventSelection?: boolean }> = React.memo(({ 
  value, 
  readOnly = false, 
  preserveFormulas = false,
  preventSelection = false
}) => {
  const className = `prose dark:prose-invert max-w-none ${preventSelection ? noSelectClass : ''}`;

  if (preserveFormulas) {
    return (
      <div className={className}>
        {renderLatex(value)}
      </div>
    );
  }
  
  return (
    <div className={className}>
      {value.split('\n').map((line, i) => (
        <div key={i} className="mb-4">
          {renderLatex(line)}
        </div>
      ))}
    </div>
  );
});

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

export const Problem: React.FC<ProblemProps> = React.memo(({
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
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [problem?.id]);
  
  useEffect(() => {
    setLocalNote(currentNote);
    // Show notes section automatically if there's saved content
    setShowNotes(!!currentNote);
  }, [currentNote]);

  // Reset local state when problem changes
  useEffect(() => {
    setIsModified(false);
    setSelectedRating(null);
  }, [problem?.id]);

  // Function to get style for each difficulty button
  const getButtonStyle = useCallback((difficulty: 'easy' | 'medium' | 'hard') => {
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
  }, [isModified, selectedRating, currentRating]);

  // Handle button click with local state update first
  const handleRatingClick = useCallback((rating: 'easy' | 'medium' | 'hard') => {
    // Update local state for immediate feedback
    setSelectedRating(rating);
    setIsModified(true);
    
    // Call parent function
    onRateQuestion(rating);
  }, [onRateQuestion]);

  return (
    <div className="space-y-6 w-full h-full">
      <Card className="shadow-lg rounded-3xl overflow-hidden h-full min-h-[480px] flex flex-col">
        <CardHeader className="pb-3 border-b border-gray-200 relative shadow-sm">
          <div className="flex justify-between items-center">
            <CardTitle>Problem for {selectedDate.format('MMMM D, YYYY')}</CardTitle>
            <div className="flex items-center gap-3">
              {problem && (
                <>
                  {/* Difficulty Rating Buttons moved to header */}
                  <div className="flex">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => handleRatingClick('easy')} 
                            variant="outline"
                            size="sm"
                            style={getButtonStyle('easy')}
                            className="rounded-l-full rounded-r-none px-3 border-r-0 h-9 min-w-[70px]"
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
                            size="sm"
                            style={getButtonStyle('medium')}
                            className="rounded-none px-3 border-x-0 h-9 min-w-[70px]"
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
                            size="sm"
                            style={getButtonStyle('hard')}
                            className="rounded-r-full rounded-l-none px-3 border-l-0 h-9 min-w-[70px]"
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
                
                  <Button 
                    onClick={onToggleBookmark}
                    variant={isBookmarked ? "default" : "ghost"}
                    size="sm"
                    disabled={isBookmarkLoading}
                    className={`rounded-full px-4 ${isBookmarked ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50' : ''}`}
                  >
                    <BookmarkIcon className="w-4 h-4 mr-2" />
                    {isBookmarkLoading ? 'Loading...' : (isBookmarked ? 'Bookmarked' : 'Bookmark')}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-transparent to-gray-100"></div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-0 pt-5">
          {problem ? (
            <div className="flex flex-col h-full justify-between">
              <div className="px-6 pb-6">
                <CustomQuill value={problem.content} readOnly={true} preventSelection={true} />
              </div>
              
              <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-6 space-y-4">
                {/* Top row with Hint/Notes and Solution Buttons */}
                <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                  {/* Left side - Hint or Notes Button */}
                  <div>
                    {problem.hint ? (
                      <Button
                        onClick={() => setShowHint(!showHint)}
                        variant="outline"
                        className={`transition-colors rounded-full py-2 ${
                          showHint 
                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                            : 'bg-amber-50/50 text-amber-500 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 mr-2 text-amber-500" />
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowNotes(!showNotes)}
                        variant="outline"
                        className={`justify-start transition-colors rounded-full py-2 ${
                          showNotes 
                            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                            : currentNote 
                              ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                              : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <FileEdit className={`w-4 h-4 mr-2 ${
                          showNotes 
                            ? 'text-blue-500' 
                            : currentNote 
                              ? 'text-green-500' 
                              : 'text-purple-500'
                        }`} />
                        {showNotes ? 'Hide Notes' : (currentNote ? 'View Your Notes' : 'Add Your Personal Notes')}
                      </Button>
                    )}
                  </div>
                  
                  {/* Solution Buttons - Always Right side */}
                  <div className="flex flex-wrap gap-2 ml-auto">
                    {problem.wSolution && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={() => window.open(problem.wSolution, '_blank')}
                              variant="outline"
                              className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-full"
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
                              className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-full"
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
                
                {/* Hint Content Section */}
                {showHint && problem.hint && (
                  <div className="mb-4 p-4 border border-amber-200 rounded-lg bg-amber-50/50 shadow-sm">
                    <CustomQuill value={problem.hint} readOnly={true} preventSelection={true} />
                  </div>
                )}

                {/* Notes Section - Only if hint exists or no hint but notes are toggled */}
                {(problem.hint || !problem.hint) && (
                  <div className="space-y-4">
                    {/* Notes Toggle Button - Only show if hint exists */}
                    {problem.hint && (
                      <Button
                        onClick={() => setShowNotes(!showNotes)}
                        variant="outline"
                        className={`max-w-[250px] justify-start transition-colors rounded-full py-2 ${
                          showNotes 
                            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                            : currentNote 
                              ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                              : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        <FileEdit className={`w-4 h-4 mr-2 ${
                          showNotes 
                            ? 'text-blue-500' 
                            : currentNote 
                              ? 'text-green-500' 
                              : 'text-purple-500'
                        }`} />
                        {showNotes ? 'Hide Notes' : (currentNote ? 'View Your Notes' : 'Add Your Personal Notes')}
                      </Button>
                    )}
                    
                    {/* Notes Section - Only show when toggled */}
                    {showNotes && (
                      <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50/50 shadow-sm">
                        <Textarea
                          value={localNote}
                          onChange={e => {
                            setLocalNote(e.target.value);
                            setIsModified(true);
                          }}
                          className="min-h-32 border-blue-200 focus-visible:ring-blue-400 rounded-md"
                          placeholder="Add your notes here..."
                        />
                        {localNote !== currentNote && (
                          <Button
                            onClick={() => onSaveNote(localNote)}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5"
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save Notes'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No problem is available for this date.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});