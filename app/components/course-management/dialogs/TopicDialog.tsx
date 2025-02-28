import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TopicDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newTopic: { id: string; name: string; description: string; courseID: string; sortOrder: number };
  setNewTopic: (topic: { id: string; name: string; description: string; courseID: string; sortOrder: number }) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  courses: Array<{ id: string; name: string; description: string }>;
  selectedCourseId: string;
}

const TopicDialog = ({
  isOpen,
  onOpenChange,
  newTopic,
  setNewTopic,
  isEditing,
  isSubmitting,
  onSubmit,
  courses,
  selectedCourseId
}: TopicDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Topic' : 'Create New Topic'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {isEditing && (
            <div>
              <Label htmlFor="courseSelect">Course</Label>
              <select
                id="courseSelect"
                value={newTopic.courseID}
                onChange={(e) => setNewTopic({ ...newTopic, courseID: e.target.value })}
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
          {!isEditing && selectedCourseId && (
            <p className="text-sm text-gray-500">
              This topic will be added to: {courses.find(c => c.id === selectedCourseId)?.name}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Topic' : 'Create Topic')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TopicDialog;