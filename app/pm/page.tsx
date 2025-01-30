"use client";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
Amplify.configure(outputs);


import { useState, useEffect } from 'react';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Card } from "@/components/ui/card";
import ProblemCalendar from './ProblemCalendar';
import { toast } from 'sonner';

const client = generateClient<Schema>();

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
            // Include nested relations
            'topics.topic.id',
            'topics.topic.name', // Assuming you want topic name from Topic model
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
      toast.success("Problem rescheduled successfully");
    } catch (error) {
      toast.error("Failed to update problem date");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <ProblemCalendar 
        problems={problems} 
        onProblemMove={handleProblemReorder}
      />
    </div>
  );
}