import React, { useState } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import _ from 'lodash';
import dynamic from 'next/dynamic';
import { Brain} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const client = generateClient<Schema>();

export default function ExamGenerator() {
  const [difficulties, setDifficulties] = useState({
    easy: false,
    medium: false,
    hard: false
  });
  interface Problem {
    id: string;
    content: string;
  }
  
  const [generatedProblems, setGeneratedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);

  const generateExam = async () => {
    setLoading(true);
    try {
      const selectedDifficulties = Object.entries(difficulties)
        .filter(([_, selected]) => selected)
        .map(([diff]) => diff);
  
      const { data: ratings } = await client.models.Rating.list();
      const problemsByDifficulty = _.groupBy(ratings, 'rating');
      
      let allSelectedIds: string[] = [];
      let difficultyMap : Record<string, string> ={};
  
      for (const difficulty of selectedDifficulties) {
        const difficultyProblems = problemsByDifficulty[difficulty] || [];
        const uniqueProblemsForDifficulty = [...new Set(difficultyProblems.map(r => r.problemID))];
        const sampledIds = _.sampleSize(uniqueProblemsForDifficulty, Math.ceil(10 / selectedDifficulties.length));
        
        sampledIds.forEach(id => {
          if (id !== null) {
            difficultyMap[id] = difficulty;
          }
        });
        
        allSelectedIds = [...allSelectedIds, ...sampledIds.filter(id => id !== null)];
      }
  
      const finalSelectedIds = _.sampleSize(allSelectedIds, 10);
      
      localStorage.setItem('examProblems', JSON.stringify(finalSelectedIds));
      localStorage.setItem('examDifficulties', JSON.stringify(difficultyMap));
      window.open('/exam', '_blank');
    } catch (error) {
      console.error('Error generating exam:', error);
      alert('Error generating exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog >
      <DialogTrigger asChild>
        <Button className="bg-blue-700 text-white hover:bg-blue-800 flex px-3 py-3 rounded transition-transform hover:scale-110 gap-3"> <Brain size={20} />Custom Quiz</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Custom Quiz</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Select Problems to Include</CardTitle>
          <div> This tool randomly selects problems based on your past ratings for the problems, creating a personalized selection just for you.</div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-5">
              {Object.entries(difficulties).map(([difficulty, checked]) => (
                <label key={difficulty} className="flex items-right space-x-2">
                  <Checkbox 
                    checked={checked}
                    onCheckedChange={(checked) => 
                      setDifficulties(prev => ({...prev, [difficulty]: checked}))
                    }
                  />
                  <span className="capitalize">{difficulty}</span>
                </label>
              ))}
            </div>
            <Button 
              onClick={generateExam} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Exam'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedProblems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Exam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generatedProblems.map((problem, index) => (
                <div key={problem.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-semibold mb-2">Problem {index + 1}</h3>
                  <ReactQuill 
                    value={problem.content}
                    readOnly={true}
                    theme="bubble"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
      </DialogContent>
    </Dialog>
  );
}