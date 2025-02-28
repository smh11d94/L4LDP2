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

interface CourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newCourse: { id: string; name: string; description: string };
  setNewCourse: (course: { id: string; name: string; description: string }) => void;
  isEditing: boolean;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const CourseDialog = ({
  isOpen,
  onOpenChange,
  newCourse,
  setNewCourse,
  isEditing,
  isSubmitting,
  onSubmit
}: CourseDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDialog;