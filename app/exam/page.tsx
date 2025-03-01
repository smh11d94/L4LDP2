"use client";

import { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import './global.css';
import 'katex/dist/katex.min.css';
import ProblemCard from './ProblemCard';
import { getCurrentUser } from "aws-amplify/auth";
import WelcomeDialog from './WelcomeDialog';
import Image from "next/image";
import { Clock, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

Amplify.configure(outputs);
const client = generateClient<Schema>();

function ExamView() {
  const [problems, setProblems] = useState<any[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: 'easy' | 'medium' | 'hard' }>({});
  const [useTimer, setUseTimer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get problem IDs from localStorage
        const problemIdsJSON = localStorage.getItem('examProblems');
        if (!problemIdsJSON) {
          setError('No problems found. Please generate a quiz first.');
          setLoading(false);
          return;
        }
        
        const problemIds = JSON.parse(problemIdsJSON);
        console.log('Problem IDs from localStorage:', problemIds);
        
        if (!Array.isArray(problemIds) || problemIds.length === 0) {
          setError('No valid problem IDs found. Please generate a quiz again.');
          setLoading(false);
          return;
        }
        
        // Fetch user info
        const user = await getCurrentUser();
        
        // Fetch each problem and its ratings
        const fetchedProblems = await Promise.all(
          problemIds.map(async (id: string) => {
            try {
              console.log('Fetching problem with ID:', id);
              const { data: problem } = await client.models.Problem.get({ id });
              
              if (!problem) {
                console.error(`Problem with ID ${id} not found`);
                return null;
              }
              
              // Fetch the user's rating for this problem
              const { data: ratings } = await client.models.Rating.list({
                filter: {
                  problemID: { eq: id },
                  owner: { eq: user.userId }
                }
              });
              
              if (ratings.length > 0 && ratings[0].rating) {
                setRatings(prev => ({
                  ...prev,
                  [id]: ratings[0].rating as 'easy' | 'medium' | 'hard'
                }));
              }
              
              return problem;
            } catch (err) {
              console.error(`Error fetching problem ${id}:`, err);
              return null;
            }
          })
        );
        
        // Filter out any nulls from problems that couldn't be fetched
        const validProblems = fetchedProblems.filter(Boolean);
        console.log('Fetched problems:', validProblems.length);
        
        if (validProblems.length === 0) {
          setError('No problems could be loaded. Please try generating a new quiz.');
        } else {
          setProblems(validProblems);
        }
      } catch (err) {
        console.error('Error fetching problems:', err);
        setError('Error loading problems. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblems();
  }, []);

  useEffect(() => {
    if (useTimer && timerStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (useTimer && timerStarted && timeRemaining === 0 && !timeExpired) {
      // Only set timeExpired to true once when we first reach zero
      setTimeExpired(true);
    }
  }, [useTimer, timerStarted, timeRemaining, timeExpired]);

  const handleTimerPreference = (timerEnabled: boolean, minutes?: number) => {
    setUseTimer(timerEnabled);
    if (timerEnabled) {
      // Use provided minutes or default to 20 minutes per problem
      const timeInSeconds = (minutes || problems.length * 20) * 60;
      setTimeRemaining(timeInSeconds);
      setTimerStarted(true);
    }
  };

  const handleDismissTimeExpired = () => {
    // First dismiss the dialog
    setTimeExpired(false);
    
    // Ensure the timer doesn't trigger the dialog again
    // by changing the timerStarted state
    setTimerStarted(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDifficultyChange = async (problemId: string, difficulty: 'easy' | 'medium' | 'hard') => {
    try {
      const user = await getCurrentUser();
      const { data: existingRatings } = await client.models.Rating.list({
        filter: {
          problemID: { eq: problemId },
          owner: { eq: user.userId }
        }
      });
  
      if (existingRatings.length > 0) {
        await client.models.Rating.update({
          id: existingRatings[0].id,
          rating: difficulty
        });
      } else {
        await client.models.Rating.create({
          rating: difficulty,
          problemID: problemId,
          date: new Date().toISOString()
        });
      }
  
      setRatings(prev => ({
        ...prev,
        [problemId]: difficulty
      }));
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <div className="mt-4 text-lg">Loading quiz problems...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="max-w-md p-6 shadow-lg">
          <CardTitle className="text-xl mb-4 text-red-600">Error</CardTitle>
          <p>{error}</p>
          <Button 
            className="mt-4 w-full" 
            onClick={() => window.close()}
          >
            Close
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <WelcomeDialog 
        totalProblems={problems.length} 
        onTimerPreference={handleTimerPreference}
      />
      
      {/* Time Expired Dialog */}
      <Dialog 
        open={timeExpired} 
        onOpenChange={(open) => {
          if (!open) {
            // When dialog is dismissed by clicking outside or pressing escape
            handleDismissTimeExpired();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              Time's Up!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Your allotted time for this quiz has expired.</p>
            <p className="mt-2">You can continue working on the problems, but your time is now up.</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleDismissTimeExpired}
              className="w-full"
            >
              Continue Working
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="p-8 max-w-5xl mx-auto mt-0">
        <Card className="shadow-lg rounded-3xl">
          <CardHeader className="border-b rounded-3xl flex flex-col sm:flex-row justify-between items-center bg-green-50 p-4">
            <div className="flex justify-center mb-5 sm:mb-0">
              <Image
                src="/logo.png"
                alt="Logo"
                width="300"
                height={300}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-2xl font-bold">Quiz</CardTitle>
              <span className="text-lg font-medium">
                Problems: {problems.length}
              </span>
              {useTimer && timerStarted && (
                <div className={`flex items-center gap-2 p-2 rounded-full px-4 mt-2 ${
                  timeRemaining <= 60 ? 'bg-red-100 animate-pulse' : 
                  timeRemaining <= 300 ? 'bg-yellow-100' : 'bg-blue-100'
                }`}>
                  <Clock size={20} className={
                    timeRemaining <= 60 ? 'text-red-600' : 
                    timeRemaining <= 300 ? 'text-yellow-600' : 'text-blue-600'
                  } />
                  <span className={`font-mono font-medium ${
                    timeRemaining <= 60 ? 'text-red-600' : 
                    timeRemaining <= 300 ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {problems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-lg text-gray-600">No problems available. Please generate a new quiz.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {problems.map((problem, index) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    index={index}
                    rating={ratings[problem.id]}
                    onDifficultyChange={handleDifficultyChange}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function AuthenticatedExamView() {
  return (
    <Authenticator>
      <ExamView />
    </Authenticator>
  );
}