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

Amplify.configure(outputs);
const client = generateClient<Schema>();

function ExamView() {
  const [problems, setProblems] = useState<any[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: 'easy' | 'medium' | 'hard' }>({});

  useEffect(() => {
    const problemIds = JSON.parse(localStorage.getItem('examProblems') || '[]');
    const selectedDifficulties = JSON.parse(localStorage.getItem('examDifficulties') || '{}');
    
    const fetchProblems = async () => {
      const user = await getCurrentUser();
      const fetchedProblems = await Promise.all(
        problemIds.map(async (id: string) => {
          const { data: problem } = await client.models.Problem.get({ id });
          const { data: ratings } = await client.models.Rating.list({
            filter: {
              problemID: { eq: id },
              owner: { eq: user.userId }
            }
          });
          
          if (ratings.length > 0) {
            if (ratings[0].rating) {
              if (ratings[0].rating !== null) {
                setRatings(prev => ({
                  ...prev,
                  [id]: ratings[0].rating as 'easy' | 'medium' | 'hard'
                }));
              }
            }
          }
          return problem;
        })
      );
      setProblems(fetchedProblems.filter(Boolean));
    };
    fetchProblems();
  }, []);

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

  return (
    <>
    <WelcomeDialog totalProblems={problems.length} />
    <div className="p-8 max-w-5xl mx-auto mt-0">
      <Card className="shadow-lg rounded-3xl">
        <CardHeader className="border-b rounded-3xl flex justify-between items-center bg-green-50 p-4">
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Logo"
            width="300"
            height={300}
          />
        </div>
          <CardTitle className="text-2xl font-bold">Quiz</CardTitle>
          <span className="text-lg font-medium">
            Number of Problems: {problems.length}
          </span>
        </CardHeader>
        <CardContent>
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