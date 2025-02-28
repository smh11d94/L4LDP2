"use client";
import { useState, useEffect } from 'react';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Import ProblemCalendar directly
import ProblemCalendar from './ProblemCalendar';

export default function CalendarPage() {
  const [problems, setProblems] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthenticator();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await client.models.Problem.list({
          selectionSet: [
            'id', 
            'content', 
            'publishDate', 
            'hint', 
            'tags',
            'topics.topic.id',
            'topics.topic.name',
            'rating.rating'
          ]
        });
        setProblems(response.data);
      } catch (error) {
        toast.error("Failed to load problems");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProblems();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96 p-6">
          <p className="text-center text-red-600">Please log in to view problems</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading problems...</p>
      </div>
    );
  }

  const handleProblemReorder = async (problemId: string, newDate: string) => {
    try {
      await client.models.Problem.update({
        id: problemId,
        publishDate: newDate
      });
      setProblems(currentProblems => 
        currentProblems.map(problem => 
          problem.id === problemId 
            ? {...problem, publishDate: newDate} 
            : problem
        )
      );
      toast.success("Problem rescheduled successfully");
    } catch (error) {
      toast.error("Failed to update problem date");
    }
  };

  return (
    <div className="container-fluid w-5/6 p-6 py-16 ">
      <ProblemCalendar 
        problems={problems} 
        onProblemMove={handleProblemReorder}
      />
    </div>
  );
}