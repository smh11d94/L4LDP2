import React from 'react';
import { Button } from "@/components/ui/button";

// Course Item Component
const CourseItem = ({
  course,
  isActive,
  onClick,
  onEdit
}: {
  course: { id: string; name: string; description: string };
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
}) => {
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

const CourseSidebar = ({
  courses,
  selectedCourseId,
  setSelectedCourseId,
  handleEditCourse,
  handleOpenNewCourse
}: {
  courses: Array<{ id: string; name: string; description: string }>;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  handleEditCourse: (course: { id: string; name: string; description: string }) => void;
  handleOpenNewCourse: () => void;
}) => {
  return (
    <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Courses</h2>
        <Button 
          onClick={handleOpenNewCourse} 
          size="sm"
          variant="outline"
        >
          Add New
        </Button>
      </div>
      
      <div className="space-y-1">
        <Button
          variant={selectedCourseId === '' ? "default" : "ghost"} 
          className="w-full justify-start text-left mb-2"
          onClick={() => setSelectedCourseId('')}
        >
          All Courses
        </Button>
        
        {courses.map((course) => (
          <CourseItem
            key={course.id}
            course={course}
            isActive={course.id === selectedCourseId}
            onClick={() => setSelectedCourseId(course.id)}
            onEdit={() => handleEditCourse(course)}
          />
        ))}
      </div>
    </div>
  );
};

export default CourseSidebar;