import React from 'react';
import { Button } from "@/components/ui/button";

interface CourseItemProps {
  course: { id: string; name: string; description: string };
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}

const CourseItem = ({
  course,
  isActive,
  onClick,
  onEdit
}: CourseItemProps) => {
  return (
    <div 
      className={`p-3 mb-2 rounded-lg cursor-pointer group transition-colors border ${
        isActive 
          ? 'bg-blue-50 border-blue-200' 
          : 'hover:bg-gray-50 border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3 className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
          {course.name}
        </h3>
        <Button 
          size="sm" 
          variant="ghost" 
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>
      </div>
      {course.description && (
        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
      )}
    </div>
  );
};

export default CourseItem;