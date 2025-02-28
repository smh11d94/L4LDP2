import React from 'react';
import { Button } from "@/components/ui/button";

interface TopicCardProps {
  topic: { 
    id: string; 
    name: string; 
    description: string; 
    courseID: string; 
    problemCount?: number; 
    sortOrder?: number 
  };
  courseName: string;
  onViewDetails: () => void;
  onEdit: () => void;
}

const TopicCard = ({
  topic,
  courseName,
  onViewDetails,
  onEdit
}: TopicCardProps) => {
  return (
    <div className="p-4 border rounded-xl hover:shadow-md hover:bg-indigo-50 transition-shadow flex flex-col h-full min-w-[250px]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{topic.name}</h3>
          <p className="text-xs text-gray-500">Course: {courseName}</p>
          {topic.sortOrder !== undefined && (
            <p className="text-xs text-gray-500">Order: {topic.sortOrder}</p>
          )}
        </div>
        <span className="text-sm bg-gray-300 px-2 py-1 rounded-xl whitespace-nowrap">
          {topic.problemCount || 0} problems
        </span>
      </div>
      
      {topic.description && (
        <p className="text-sm text-gray-600 mt-2">{topic.description}</p>
      )}
      
      <div className="flex space-x-2 mt-auto pt-3">
        <Button 
          size="sm" 
          onClick={onViewDetails}
          className="flex-1 bg-purple-200 hover:bg-purple-400 rounded-xl"
        >
          View Details
        </Button>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={onEdit}
          className="flex-1 bg-blue-200 hover:bg-blue-400 rounded-xl"
        >
          Edit
        </Button>
      </div>
    </div>
  );
};

export default TopicCard;