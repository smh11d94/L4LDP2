import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { GripVertical } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TopicSortDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  onSaveOrder: (orderedTopics: any[]) => Promise<void>;
}

const TopicSortDialog = ({ 
  isOpen, 
  onOpenChange, 
  courseId,
  courseName,
  onSaveOrder
}: TopicSortDialogProps) => {
  const [courseTopics, setCourseTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const client = generateClient<Schema>();
  
  useEffect(() => {
    if (courseId && isOpen) {
      fetchCourseTopics();
    }
  }, [courseId, isOpen]);
  
  const fetchCourseTopics = async () => {
    setIsLoading(true);
    try {
      const response = await client.models.Topic.list({
        filter: { courseID: { eq: courseId } }
      });
      setCourseTopics(response.data);
    } catch (error) {
      toast.error("Failed to load topics for sorting");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Use a transparent ghost image
    const ghostElement = document.createElement("div");
    ghostElement.style.width = "0px";
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // This creates the visual effect of items moving as you drag
    const newTopics = [...courseTopics];
    const draggedItem = newTopics[draggedItemIndex];
    newTopics.splice(draggedItemIndex, 1);
    newTopics.splice(index, 0, draggedItem);
    
    setCourseTopics(newTopics);
    setDraggedItemIndex(index);
  };
  
  const handleDragEnd = () => {
    // Update the sort orders
    const updatedTopics = courseTopics.map((topic, index) => ({
      ...topic,
      sortOrder: index + 1
    }));
    
    setCourseTopics(updatedTopics);
    setDraggedItemIndex(null);
  };
  
  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      await onSaveOrder(courseTopics);
      toast.success("Topic order saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save topic order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!isSaving && open === false) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Sort Topics for {courseName}</DialogTitle>
          <DialogDescription>
            Drag and drop topics to change their order
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-6 text-center">Loading topics...</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {courseTopics.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No topics found for this course</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {courseTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 border rounded-md bg-white mb-2 cursor-move transition-all ${
                      draggedItemIndex === index ? 'opacity-40 ring-2 ring-blue-500' : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-2 text-gray-400">
                        <GripVertical size={20} className="cursor-grab" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{topic.name}</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">Order: {topic.sortOrder}</span>
                          <span className="text-blue-500">{topic.problemCount || 0} problems</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveOrder}
            disabled={isSaving || courseTopics.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TopicSortDialog;