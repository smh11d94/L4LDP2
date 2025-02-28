import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { format, parseISO } from "date-fns";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Helper function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return "Not published";
  const date = parseISO(dateString);
  return format(date, "MMM d, yyyy");
};

interface TopicDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic: any;
  onDelete: () => void;
}

const TopicDetailsDialog = ({ 
  isOpen, 
  onOpenChange, 
  topic, 
  onDelete
}: TopicDetailsDialogProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [problemsWithTopics, setProblemsWithTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const client = generateClient<Schema>();
  
  useEffect(() => {
    if (topic?.id) {
      fetchTopicProblems();
    }
  }, [topic]);
  
  const fetchTopicProblems = async () => {
    setIsLoading(true);
    try {
      // First get the problem-topic relationships for this topic
      const problemTopicsResponse = await client.models.ProblemTopic.list({
        filter: { topicID: { eq: topic.id } }
      });
      
      if (problemTopicsResponse.data.length > 0) {
        // Get all the problem IDs
        const problemIds = problemTopicsResponse.data.map(pt => pt.problemID);
        
        // Fetch all problems
        const problemsResponse = await client.models.Problem.list();
        
        // Filter only the problems that belong to this topic
        const topicProblems = problemsResponse.data.filter(problem => 
          problemIds.includes(problem.id)
        );
        
        // Sort problems by publishDate from oldest to newest
        const sortedProblems = topicProblems.sort((a, b) => {
          const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
          const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
          return dateA - dateB;
        });
        
        // Fetch all topics for these problems
        const allProblemTopicsResponse = await client.models.ProblemTopic.list();
        const allTopicsResponse = await client.models.Topic.list();
        
        // Create a map of problem IDs to their associated topics
        const problemTopicsMap = new Map();
        
        // For each problem in our list
        for (const problem of sortedProblems) {
          // Find all problem-topic relationships for this problem
          const problemTopics = allProblemTopicsResponse.data.filter(pt => 
            pt.problemID === problem.id
          );
          
          // Get the topic objects for these relationships
          const topicObjects = problemTopics.map(pt => {
            const topicObj = allTopicsResponse.data.find(t => t.id === pt.topicID);
            return topicObj ? { id: topicObj.id, name: topicObj.name } : null;
          }).filter(Boolean);
          
          // Store in our map
          problemTopicsMap.set(problem.id, {
            ...problem,
            topics: topicObjects
          });
        }
        
        // Convert map to array
        const problemsWithTopicsArray = Array.from(problemTopicsMap.values());
        setProblemsWithTopics(problemsWithTopicsArray);
      } else {
        setProblemsWithTopics([]);
      }
    } catch (error) {
      console.error("Error fetching topic problems:", error);
      toast.error("Failed to load problems for this topic");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{topic?.name}</DialogTitle>
            <DialogDescription>{topic?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Problem Dates & Topics</h3>
            {isLoading ? (
              <div className="text-center py-4">Loading problem data...</div>
            ) : (
              <>
                {problemsWithTopics.length > 0 ? (
                  <div className="mt-4">
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Publish Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {problemsWithTopics.map((problem, index) => (
                            <tr key={problem.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-4 py-2 text-sm">
                                {formatDate(problem.publishDate)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {problem.topics.map((t: any) => (
                                    <span 
                                      key={t.id} 
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        t.id === topic.id 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {problemsWithTopics.length} problems in this topic
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No problems in this topic</p>
                )}
              </>
            )}
            
            <div className="border-t pt-4">
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full"
              >
                Delete Topic
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                This will remove the topic, but not delete associated problems.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the topic "{topic?.name}". 
              Problems associated with this topic will not be deleted but will no longer be associated with this topic.
              <div className="mt-4">
                <Label htmlFor="confirmDelete" className="text-sm font-medium">
                  Type <span className="font-bold">delete-{topic?.name.toLowerCase().replace(/\s+/g, '-')}</span> to confirm:
                </Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmation === `delete-${topic?.name.toLowerCase().replace(/\s+/g, '-')}`) {
                  onDelete();
                  setIsDeleteDialogOpen(false);
                  setDeleteConfirmation('');
                } else {
                  toast.error('Confirmation text does not match');
                }
              }}
              disabled={deleteConfirmation !== `delete-${topic?.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Topic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TopicDetailsDialog;