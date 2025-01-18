import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomQuill } from './LatexRenderer';

interface ProblemCardProps {
  problem: {
    id: string;
    content: string;
  };
  index: number;
  rating?: string;
  onDifficultyChange: (problemId: string, difficulty: "easy" | "medium" | "hard") => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, index, rating, onDifficultyChange }) => {
  const getDifficultyColor = (difficulty?: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || '';
  };

  return (
    <div className="border-b pb-6 last:border-b-0">
      <div className="flex justify-between items-center mb-4 pt-5">
        <h3 className="font-bold text-xl">Problem {index + 1}</h3>
        <div className="flex items-center gap-4">
         
          <Select value={rating} onValueChange={(value) => onDifficultyChange(problem.id, value as "easy" | "medium" | "hard")}>
  <SelectTrigger className={`w-24 px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(rating)}`}>
    <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent className='bg-gray-50 rounded-2xl' >
              <SelectItem className="text-green-500" value="easy">Easy</SelectItem>
              <SelectItem className="text-orange-500" value="medium">Medium</SelectItem>
              <SelectItem className="text-red-500" value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <CustomQuill value={problem.content} readOnly={true} />
    </div>
  );
};

export default ProblemCard;