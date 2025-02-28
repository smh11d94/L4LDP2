import React, { useState, useEffect } from 'react';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import CourseSidebar from './CourseSidebar';
import TopicsList from './TopicsList';
import TopicDialog from './dialogs/TopicDialog';
import CourseDialog from './dialogs/CourseDialog';
import TopicDetailsDialog from './dialogs/TopicDetailsDialog';
import TopicSortDialog from './dialogs/TopicSortDialog';

Amplify.configure(outputs);

const client = generateClient<Schema>();

const CourseManagement = () => {
  const [courses, setCourses] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [newCourse, setNewCourse] = useState({ id: '', name: '', description: '' });
  const [newTopic, setNewTopic] = useState({ id: '', name: '', description: '', courseID: '', sortOrder: 0 });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topics, setTopics] = useState<Array<{ id: string; name: string; description: string; courseID: string; problemCount?: number; sortOrder?: number }>>([]);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [isTopicDetailsOpen, setIsTopicDetailsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  
  const { user } = useAuthenticator();

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
        // sort: { field: 'sortOrder', direction: 'asc' }
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
    if (!user) {
      toast.error('You must be logged in to manage courses');
      return;
    }

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
    if (!user) {
      toast.error('You must be logged in to manage topics');
      return;
    }

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

  const handleEditCourse = (course: { id: string; name: string; description: string }) => {
    setNewCourse(course);
    setIsEditing(true);
    setIsCourseDialogOpen(true);
  };

  const handleEditTopic = (topic: { id: string; name: string; description: string; courseID: string; sortOrder?: number }) => {
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

  const handleViewTopicDetails = (topic: any) => {
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

  const handleSaveTopicOrder = async (orderedTopics: any[]) => {
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

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Please log in to manage courses and topics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh)]">
      <CourseSidebar 
        courses={courses}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        handleEditCourse={handleEditCourse}
        handleOpenNewCourse={handleOpenNewCourse}
      />
      
      <TopicsList
        topics={topics}
        courses={courses}
        selectedCourseId={selectedCourseId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleViewTopicDetails={handleViewTopicDetails}
        handleEditTopic={handleEditTopic}
        handleOpenNewTopic={handleOpenNewTopic}
        handleOpenSortDialog={handleOpenSortDialog}
      />
      
      {/* Dialogs */}
      <CourseDialog
        isOpen={isCourseDialogOpen}
        onOpenChange={setIsCourseDialogOpen}
        newCourse={newCourse}
        setNewCourse={setNewCourse}
        isEditing={isEditing}
        isSubmitting={isSubmittingCourse}
        onSubmit={handleCreateOrUpdateCourse}
      />
      
      <TopicDialog
        isOpen={isTopicDialogOpen}
        onOpenChange={setIsTopicDialogOpen}
        newTopic={newTopic}
        setNewTopic={setNewTopic}
        isEditing={isEditing}
        isSubmitting={isSubmittingTopic}
        onSubmit={handleCreateOrUpdateTopic}
        courses={courses}
        selectedCourseId={selectedCourseId}
      />

      {selectedTopic && (
        <TopicDetailsDialog
          isOpen={isTopicDetailsOpen}
          onOpenChange={setIsTopicDetailsOpen}
          topic={selectedTopic}
          onDelete={handleDeleteTopic}
        />
      )}

      {selectedCourseId && (
        <TopicSortDialog
          isOpen={isSortDialogOpen}
          onOpenChange={setIsSortDialogOpen}
          courseId={selectedCourseId}
          courseName={selectedCourse?.name || ''}
          onSaveOrder={handleSaveTopicOrder}
        />
      )}
    </div>
  );
};

export default CourseManagement;