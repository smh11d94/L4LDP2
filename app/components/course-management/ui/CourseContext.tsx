import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  description: string;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  courseID: string;
  problemCount?: number;
  sortOrder?: number;
}

interface CourseContextType {
  courses: Course[];
  topics: Topic[];
  selectedCourseId: string;
  searchQuery: string;
  isCourseDialogOpen: boolean;
  isTopicDialogOpen: boolean;
  isTopicDetailsOpen: boolean;
  isSortDialogOpen: boolean;
  isEditing: boolean;
  selectedTopic: Topic | null;
  newCourse: Course;
  newTopic: Topic & { sortOrder: number };
  isSubmittingCourse: boolean;
  isSubmittingTopic: boolean;
  isDeleting: boolean;
  
  // Methods
  setSelectedCourseId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setIsCourseDialogOpen: (isOpen: boolean) => void;
  setIsTopicDialogOpen: (isOpen: boolean) => void;
  setIsTopicDetailsOpen: (isOpen: boolean) => void;
  setIsSortDialogOpen: (isOpen: boolean) => void;
  setNewCourse: (course: Course) => void;
  setNewTopic: (topic: Topic & { sortOrder: number }) => void;
  
  // Actions
  fetchCourses: () => Promise<void>;
  fetchTopics: () => Promise<void>;
  handleCreateOrUpdateCourse: (e: React.FormEvent) => Promise<void>;
  handleCreateOrUpdateTopic: (e: React.FormEvent) => Promise<void>;
  handleEditCourse: (course: Course) => void;
  handleEditTopic: (topic: Topic) => void;
  handleOpenNewCourse: () => void;
  handleOpenNewTopic: () => void;
  handleViewTopicDetails: (topic: Topic) => void;
  handleDeleteTopic: () => Promise<void>;
  handleOpenSortDialog: () => void;
  handleSaveTopicOrder: (orderedTopics: Topic[]) => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [newCourse, setNewCourse] = useState<Course>({ id: '', name: '', description: '' });
  const [newTopic, setNewTopic] = useState<Topic & { sortOrder: number }>({ 
    id: '', name: '', description: '', courseID: '', sortOrder: 0 
  });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isTopicDetailsOpen, setIsTopicDetailsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  
  const client = generateClient<Schema>();

  useEffect(() => {
    fetchCourses();
    fetchTopics();
  }, []);

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses]);

  const fetchCourses = async () => {
    try {
      const response = await client.models.Course.list();
      setCourses(response.data.map((course: any) => ({
        id: course.id,
        name: course.name || '',
        description: course.description || ''
      })));
    } catch (error) {
      toast.error("Failed to load courses");
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await client.models.Topic.list({
        sort: { field: 'sortOrder', direction: 'asc' }
      });
      const problemTopics = await client.models.ProblemTopic.list();
      
      const topicsWithCounts = response.data.map((topic: any) => {
        const problemCount = problemTopics.data.filter(pt => pt.topicID === topic.id).length;
        return { 
          id: topic.id,
          name: topic.name || '',
          description: topic.description || '',
          courseID: topic.courseID,
          sortOrder: topic.sortOrder || 1000,
          problemCount 
        };
      });
      
      setTopics(topicsWithCounts);
    } catch (error) {
      toast.error("Failed to load topics");
    }
  };

  const handleCreateOrUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCourse.name) {
      toast.error('Course name is required');
      return;
    }

    setIsSubmittingCourse(true);
    try {
      if (isEditing) {
        await client.models.Course.update({
          id: newCourse.id,
          name: newCourse.name,
          description: newCourse.description
        });
        toast.success('Course updated successfully');
      } else {
        const result = await client.models.Course.create({
          name: newCourse.name,
          description: newCourse.description
        });
        
        if (courses.length === 0 && result.data) {
          setSelectedCourseId(result.data.id);
        }
        
        toast.success('Course created successfully');
      }
      
      setIsCourseDialogOpen(false);
      setNewCourse({ id: '', name: '', description: '' });
      setIsEditing(false);
      fetchCourses();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update course' : 'Failed to create course');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleCreateOrUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetCourseId = isEditing ? newTopic.courseID : selectedCourseId;
    
    if (!newTopic.name || !targetCourseId) {
      toast.error('Topic name and course selection are required');
      return;
    }

    setIsSubmittingTopic(true);
    try {
      let sortOrder = newTopic.sortOrder;
      if (!isEditing) {
        const courseTopics = topics.filter(t => t.courseID === targetCourseId);
        if (courseTopics.length > 0) {
          const maxSortOrder = Math.max(...courseTopics.map(t => t.sortOrder || 0));
          sortOrder = maxSortOrder + 10;
        } else {
          sortOrder = 10;
        }
      }

      if (isEditing) {
        await client.models.Topic.update({
          id: newTopic.id,
          name: newTopic.name,
          description: newTopic.description,
          courseID: newTopic.courseID,
          sortOrder: newTopic.sortOrder
        });
        toast.success('Topic updated successfully');
      } else {
        await client.models.Topic.create({
          name: newTopic.name,
          description: newTopic.description,
          courseID: targetCourseId,
          sortOrder
        });
        toast.success('Topic created successfully');
      }
      
      setIsTopicDialogOpen(false);
      setNewTopic({ id: '', name: '', description: '', courseID: '', sortOrder: 0 });
      setIsEditing(false);
      fetchTopics();
    } catch (error) {
      toast.error(isEditing ? 'Failed to update topic' : 'Failed to create topic');
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setNewCourse(course);
    setIsEditing(true);
    setIsCourseDialogOpen(true);
  };

  const handleEditTopic = (topic: Topic) => {
    setNewTopic({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      courseID: topic.courseID,
      sortOrder: topic.sortOrder || 0
    });
    setIsEditing(true);
    setIsTopicDialogOpen(true);
  };

  const handleOpenNewCourse = () => {
    setNewCourse({ id: '', name: '', description: '' });
    setIsEditing(false);
    setIsCourseDialogOpen(true);
  };

  const handleOpenNewTopic = () => {
    setNewTopic({ id: '', name: '', description: '', courseID: '', sortOrder: 0 });
    setIsEditing(false);
    setIsTopicDialogOpen(true);
  };

  const handleViewTopicDetails = (topic: Topic) => {
    setSelectedTopic(topic);
    setIsTopicDetailsOpen(true);
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;
    
    setIsDeleting(true);
    try {
      const problemTopicsResponse = await client.models.ProblemTopic.list({
        filter: { topicID: { eq: selectedTopic.id } }
      });
      
      for (const pt of problemTopicsResponse.data) {
        await client.models.ProblemTopic.delete({ id: pt.id });
      }
      
      await client.models.Topic.delete({ id: selectedTopic.id });
      
      toast.success('Topic deleted successfully');
      setIsTopicDetailsOpen(false);
      fetchTopics();
    } catch (error) {
      toast.error('Failed to delete topic');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleOpenSortDialog = () => {
    if (!selectedCourseId) {
      toast.error('Please select a course first');
      return;
    }
    setIsSortDialogOpen(true);
  };

  const handleSaveTopicOrder = async (orderedTopics: Topic[]) => {
    try {
      for (const topic of orderedTopics) {
        await client.models.Topic.update({
          id: topic.id,
          sortOrder: topic.sortOrder
        });
      }
      
      fetchTopics();
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const value = {
    courses,
    topics,
    selectedCourseId,
    searchQuery,
    isCourseDialogOpen,
    isTopicDialogOpen,
    isTopicDetailsOpen,
    isSortDialogOpen,
    isEditing,
    selectedTopic,
    newCourse,
    newTopic,
    isSubmittingCourse,
    isSubmittingTopic,
    isDeleting,
    
    // Methods
    setSelectedCourseId,
    setSearchQuery,
    setIsCourseDialogOpen,
    setIsTopicDialogOpen,
    setIsTopicDetailsOpen,
    setIsSortDialogOpen,
    setNewCourse,
    setNewTopic,
    
    // Actions
    fetchCourses,
    fetchTopics,
    handleCreateOrUpdateCourse,
    handleCreateOrUpdateTopic,
    handleEditCourse,
    handleEditTopic,
    handleOpenNewCourse,
    handleOpenNewTopic,
    handleViewTopicDetails,
    handleDeleteTopic,
    handleOpenSortDialog,
    handleSaveTopicOrder,
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;