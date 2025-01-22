import React, { useState, useEffect } from 'react';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
Amplify.configure(outputs);


const client = generateClient<Schema>();

const CourseManagement = () => {
  const [courses, setCourses] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [newCourse, setNewCourse] = useState({ id: '', name: '', description: '' });
  const [newTopic, setNewTopic] = useState({ id: '', name: '', description: '', courseID: '' });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topics, setTopics] = useState<Array<{ id: string; name: string; description: string; courseID: string; problemCount?: number }>>([]);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { user } = useAuthenticator();

  useEffect(() => {
    fetchCourses();
    fetchTopics();
  }, []);
 
  const fetchCourses = async () => {
    try {
      const response = await client.models.Course.list();
      setCourses(response.data.map(course => ({
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
      const response = await client.models.Topic.list();
      const problemTopics = await client.models.ProblemTopic.list();
      
      const topicsWithCounts = response.data.map(topic => {
        const problemCount = problemTopics.data.filter(pt => pt.topicID === topic.id).length;
        return { 
          id: topic.id,
          name: topic.name || '', 
          description: topic.description || '',
          courseID: topic.courseID || '',
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
        await client.models.Course.create({
          name: newCourse.name,
          description: newCourse.description
        });
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

    if (!newTopic.name || (!isEditing && !selectedCourse)) {
      toast.error('Topic name and course selection are required');
      return;
    }

    setIsSubmittingTopic(true);
    try {
      if (isEditing) {
        await client.models.Topic.update({
          id: newTopic.id,
          name: newTopic.name,
          description: newTopic.description,
          courseID: newTopic.courseID
        });
        toast.success('Topic updated successfully');
      } else {
        await client.models.Topic.create({
          name: newTopic.name,
          description: newTopic.description,
          courseID: selectedCourse
        });
        toast.success('Topic created successfully');
      }
      
      setIsTopicDialogOpen(false);
      setNewTopic({ id: '', name: '', description: '', courseID: '' });
      setSelectedCourse('');
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

  const handleEditTopic = (topic: { id: string; name: string; description: string; courseID: string }) => {
    setNewTopic(topic);
    setSelectedCourse(topic.courseID);
    setIsEditing(true);
    setIsTopicDialogOpen(true);
  };

  const handleOpenNewCourse = () => {
    setNewCourse({ id: '', name: '', description: '' });
    setIsEditing(false);
    setIsCourseDialogOpen(true);
  };

  const handleOpenNewTopic = () => {
    setNewTopic({ id: '', name: '', description: '', courseID: '' });
    setSelectedCourse('');
    setIsEditing(false);
    setIsTopicDialogOpen(true);
  };

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
    <div className="container max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {/* Course Management Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
              <Button onClick={handleOpenNewCourse} className="w-full mb-4">
                Add New Course
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrUpdateCourse} className="space-y-4">
                  <div>
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="courseDescription">Description</Label>
                    <Textarea
                      id="courseDescription"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingCourse}>
                    {isSubmittingCourse ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleEditCourse(course)}
                >
                  <h3 className="font-medium">{course.name}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-600">{course.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topic Management Section */}
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
              <Button onClick={handleOpenNewTopic} className="w-full mb-4">
                Add New Topic
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrUpdateTopic} className="space-y-4">
                  {!isEditing && (
                    <div>
                      <Label htmlFor="courseSelect">Select Course</Label>
                      <select
                        id="courseSelect"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Select a course</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="topicName">Topic Name</Label>
                    <Input
                      id="topicName"
                      value={newTopic.name}
                      onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="topicDescription">Description</Label>
                    <Textarea
                      id="topicDescription"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmittingTopic}>
                    {isSubmittingTopic ? 'Saving...' : (isEditing ? 'Update Topic' : 'Create Topic')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-2 grid grid-cols-3 gap-4">
              {topics.map((topic) => {
                const course = courses.find(c => c.id === topic.courseID);
                return (
                  <div 
                    key={topic.id} 
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEditTopic(topic)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{topic.name}</h3>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                        {topic.problemCount || 0} problems
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-sm text-gray-600">{topic.description}</p>
                    )}
                    <p className="text-xs text-gray-500">Course: {course?.name || 'Unknown'}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseManagement;