import React, { useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Topic Card Component
const TopicCard = ({
  topic,
  courseName,
  onViewDetails,
  onEdit
}: {
  topic: { id: string; name: string; description: string; courseID: string; problemCount?: number; sortOrder?: number };
  courseName: string;
  onViewDetails: () => void;
  onEdit: () => void;
}) => {
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

const TopicsList = ({
  topics,
  courses,
  selectedCourseId,
  searchQuery,
  setSearchQuery,
  handleViewTopicDetails,
  handleEditTopic,
  handleOpenNewTopic,
  handleOpenSortDialog
}: {
  topics: Array<{ id: string; name: string; description: string; courseID: string; problemCount?: number; sortOrder?: number }>;
  courses: Array<{ id: string; name: string; description: string }>;
  selectedCourseId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleViewTopicDetails: (topic: any) => void;
  handleEditTopic: (topic: any) => void;
  handleOpenNewTopic: () => void;
  handleOpenSortDialog: () => void;
}) => {
  // Filter topics based on search query and selected course
  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      // Match search query
      const matchesSearch = searchQuery === '' || 
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Match selected course (if any)
      const matchesCourse = selectedCourseId === '' || topic.courseID === selectedCourseId;
      
      return matchesSearch && matchesCourse;
    }).sort((a, b) => (a.sortOrder || 1000) - (b.sortOrder || 1000));
  }, [topics, searchQuery, selectedCourseId]);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {selectedCourseId 
              ? `${courses.find(c => c.id === selectedCourseId)?.name || ''}` 
              : 'All Topics'}
          </h1>
          <div className="flex gap-2">
            {selectedCourseId && (
              <Button 
                onClick={handleOpenSortDialog} 
                variant="outline"
                className="mx-2"
              >
                Sort Topics
              </Button>
            )}
            <Button onClick={handleOpenNewTopic} className='mr-12'>Add New Topic</Button>
          </div>
        </div>
        
        {/* Search Box */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="rounded-xl h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Topics Grid */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredTopics.map((topic) => {
              const course = courses.find(c => c.id === topic.courseID);
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  courseName={course?.name || 'Unknown'}
                  onViewDetails={() => handleViewTopicDetails(topic)}
                  onEdit={() => handleEditTopic(topic)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">
              {searchQuery 
                ? "No topics match your search" 
                : selectedCourseId 
                  ? "No topics for this course yet" 
                  : "No topics available"}
            </p>
            <Button 
              onClick={handleOpenNewTopic} 
              className="mt-4"
              variant="outline"
            >
              Create a Topic
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicsList;
