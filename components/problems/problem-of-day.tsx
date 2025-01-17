'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { BookmarkIcon, MessageCircle } from "lucide-react";

const ProblemOfDay = () => {
  // This would typically come from your API/database
  const problem = {
    content: "What is the time complexity of binary search?",
    topics: [{ topic: { name: "Algorithms" } }],
    tags: ["algorithms", "complexity"],
    rating: { rating: "medium" },
    publishDate: new Date().toLocaleDateString(),
    hint: "Think about how the input size is reduced in each step."
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500 hover:bg-green-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'hard':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">Problem of the Day</CardTitle>
          <span className="text-sm text-muted-foreground">
            {problem.publishDate}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Problem Content */}
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            {problem.content}
          </p>
          
          {/* Difficulty Badge */}
          {problem.rating && (
            <Badge 
              variant="secondary"
              className={`${getDifficultyColor(problem.rating.rating)} text-white`}
            >
              {problem.rating.rating}
            </Badge>
          )}
        </div>

        {/* Topics */}
        {problem.topics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Topics</h4>
            <div className="flex flex-wrap gap-2">
              {problem.topics.map((topic, index) => (
                <Badge key={index} variant="outline">
                  {topic.topic.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {problem.tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {problem.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-6">
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <BookmarkIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        {problem.hint && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost">Show Hint</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">{problem.hint}</p>
            </HoverCardContent>
          </HoverCard>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProblemOfDay;