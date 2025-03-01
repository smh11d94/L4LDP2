import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import _ from 'lodash';
import dynamic from 'next/dynamic';
import { Brain, BookOpen, BarChart3, Hash, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const client = generateClient<Schema>();

export default function ExamGenerator() {
  const [difficulties, setDifficulties] = useState({
    easy: false,
    medium: false,
    hard: false
  });
  
  const [topicsState, setTopicsState] = useState<Record<string, boolean>>({});
  const [allTopics, setAllTopics] = useState<Array<{id: string, name: string, sortOrder: number}>>([]);
  const [problemCount, setProblemCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("filterType");
  
  // New state for filter type selection
  const [filterType, setFilterType] = useState<"topics" | "difficulty">("topics");
  
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const { data: topics } = await client.models.Topic.list();
        
        const sortedTopics = [...topics].sort((a, b) => {
          const orderA = a.sortOrder || 0;
          const orderB = b.sortOrder || 0;
          return orderA - orderB;
        });
        
        setAllTopics(sortedTopics.map(topic => ({
          id: topic.id,
          name: topic.name || 'Unnamed Topic',
          sortOrder: topic.sortOrder || 0
        })));
        
        const initialTopicState: Record<string, boolean> = {};
        sortedTopics.forEach(topic => {
          initialTopicState[topic.id] = false;
        });
        
        setTopicsState(initialTopicState);
      } catch (error) {
        console.error('Error fetching topics:', error);
        setErrorMessage("Failed to load topics. Please refresh and try again.");
      } finally {
        setLoadingTopics(false);
      }
    };
    
    fetchTopics();
  }, []);

  const getSelectedCount = (type: 'topics' | 'difficulties') => {
    if (type === 'topics') {
      return Object.values(topicsState).filter(Boolean).length;
    } else {
      return Object.values(difficulties).filter(Boolean).length;
    }
  };

  const generateExam = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      const { data: allAvailableProblems } = await client.models.Problem.list();
      
      if (allAvailableProblems.length === 0) {
        throw new Error("No problems available in the database");
      }
      
      console.log(`Found ${allAvailableProblems.length} total problems in the database`);
      
      let filteredProblems = [...allAvailableProblems];
      
      if (filterType === "topics") {
        // Filter by topics only
        const selectedTopicIds = Object.entries(topicsState)
          .filter(([_, selected]) => selected)
          .map(([id]) => id);
        
        if (selectedTopicIds.length > 0) {
          console.log(`Filtering by ${selectedTopicIds.length} selected topics`);
          
          const { data: problemTopics } = await client.models.ProblemTopic.list();
          
          const problemToTopics: Record<string, Set<string>> = {};
          
          problemTopics.forEach(pt => {
            if (pt.problemID && pt.topicID) {
              if (!problemToTopics[pt.problemID]) {
                problemToTopics[pt.problemID] = new Set();
              }
              problemToTopics[pt.problemID].add(pt.topicID);
            }
          });
          
          const problemsWithSelectedTopics = filteredProblems.filter(problem => 
            problem.id && 
            problemToTopics[problem.id] && 
            selectedTopicIds.some(topicId => problemToTopics[problem.id].has(topicId))
          );
          
          console.log(`Found ${problemsWithSelectedTopics.length} problems matching selected topics`);
          
          if (problemsWithSelectedTopics.length > 0) {
            filteredProblems = problemsWithSelectedTopics;
          } else {
            console.warn("No problems match the selected topics, using all problems");
          }
        }
      } else if (filterType === "difficulty") {
        // Filter by difficulty only
        const selectedDifficulties = Object.entries(difficulties)
          .filter(([_, selected]) => selected)
          .map(([diff]) => diff);
        
        if (selectedDifficulties.length > 0) {
          console.log(`Filtering by difficulties: ${selectedDifficulties.join(', ')}`);
          
          const { data: allRatings } = await client.models.Rating.list();
          
          const problemToDifficulty: Record<string, string> = {};
          
          allRatings.forEach(rating => {
            if (rating.problemID && rating.rating) {
              problemToDifficulty[rating.problemID] = rating.rating;
            }
          });
          
          const problemsWithSelectedDifficulties = filteredProblems.filter(problem => 
            problem.id && 
            problemToDifficulty[problem.id] && 
            selectedDifficulties.includes(problemToDifficulty[problem.id])
          );
          console.log(`Found ${problemsWithSelectedDifficulties.length} problems matching selected difficulties`);
          
          if (problemsWithSelectedDifficulties.length > 0) {
            filteredProblems = problemsWithSelectedDifficulties;
          } else {
            console.warn("No problems match the selected difficulties, using all problems");
          }
        }
      }
      
      // If no problems match our filters, use all problems
      if (filteredProblems.length === 0) {
        filteredProblems = allAvailableProblems;
      }
      
      const numToSelect = Math.min(parseInt(problemCount), filteredProblems.length);
      const selectedProblems = _.sampleSize(filteredProblems, numToSelect);
      
      console.log(`Selected ${selectedProblems.length} problems for the exam`);
      
      const selectedProblemIds = selectedProblems
        .map(p => p.id)
        .filter(Boolean);
      
      if (selectedProblemIds.length === 0) {
        throw new Error("Failed to select valid problems");
      }
      
      localStorage.setItem('examProblems', JSON.stringify(selectedProblemIds));
      localStorage.setItem('examCount', problemCount);
      
      window.open('/exam', '_blank');
    } catch (error) {
      console.error('Error generating exam:', error);
      setErrorMessage(error instanceof Error ? 
        error.message : 
        "An unknown error occurred while generating the quiz");
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      hard: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[difficulty as keyof typeof colors] || '';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-blue-700 text-white hover:bg-blue-800 flex px-3 py-3 rounded transition-transform hover:scale-110 gap-3 shadow-lg"> 
          <Brain size={20} />Custom Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-xl rounded-xl p-0 focus:outline-none">
        <DialogHeader className="bg-blue-600 text-white p-6 rounded-t-xl">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Create Your Custom Quiz
          </DialogTitle>
          <p className="text-blue-100 mt-2">
            Personalize your learning experience by selecting topics or difficulty levels
          </p>
        </DialogHeader>
        
        <div className="px-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger 
                value="filterType" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
              >
                Filter Type
              </TabsTrigger>
              <TabsTrigger 
                value="filterOptions" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
              >
                {filterType === "topics" ? (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Topics
                    {getSelectedCount('topics') > 0 && (
                      <Badge className="ml-2 bg-blue-600">{getSelectedCount('topics')}</Badge>
                    )}
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Difficulty
                    {getSelectedCount('difficulties') > 0 && (
                      <Badge className="ml-2 bg-blue-600">{getSelectedCount('difficulties')}</Badge>
                    )}
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="count" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900"
              >
                <Hash className="h-4 w-4" />
                Problem Count
              </TabsTrigger>
            </TabsList>
            
            <div className="border border-blue-200 rounded-xl p-4 bg-white shadow-sm mb-6">
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="filterType" className="mt-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl text-blue-800">Choose Filter Type</CardTitle>
                    <CardDescription>
                      Select whether to filter problems by topics or by difficulty ratings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <RadioGroup 
                      value={filterType} 
                      onValueChange={(value) => setFilterType(value as "topics" | "difficulty")}
                      className="space-y-4"
                    >
                      <div className="flex items-start space-x-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                        <RadioGroupItem value="topics" id="topics" className="mt-1" />
                        <div>
                          <Label htmlFor="topics" className="text-lg font-medium flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            Filter by Topics
                          </Label>
                          <p className="text-gray-600 mt-1">
                            Problems will be selected based on the specific topics you choose
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                        <RadioGroupItem value="difficulty" id="difficulty" className="mt-1" />
                        <div>
                          <Label htmlFor="difficulty" className="text-lg font-medium flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Filter by Difficulty
                          </Label>
                          <p className="text-gray-600 mt-1">
                            Problems will be selected based on how you've rated them in the past (easy, medium, or hard)
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                    
                    <div className="mt-4 text-sm text-blue-800 bg-blue-100 p-3 rounded-md">
                      <p>After choosing a filter type, go to the next tab to select specific {filterType === "topics" ? "topics" : "difficulty levels"}.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="filterOptions" className="mt-0">
                {filterType === "topics" ? (
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-xl text-blue-800">Select Topics</CardTitle>
                      <CardDescription>
                        Choose specific topics to focus on in your quiz
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      {loadingTopics ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            {allTopics.map(topic => (
                              <div
                                key={topic.id}
                                className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <label className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                                  <Checkbox 
                                    checked={topicsState[topic.id] || false}
                                    onCheckedChange={(checked) => 
                                      setTopicsState(prev => ({...prev, [topic.id]: !!checked}))
                                    }
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:text-white h-5 w-5"
                                  />
                                  <span className="font-medium">{topic.name}</span>
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-4">
                            Leave all unchecked to include problems from all topics
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-none">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-xl text-blue-800">Select Difficulty Levels</CardTitle>
                      <CardDescription>
                        Choose which difficulty levels to include in your quiz
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          These difficulty levels are based on how you've rated problems in the past. 
                          Only problems that match your selected difficulty ratings will be included.
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(difficulties).map(([difficulty, checked]) => (
                          <div
                            key={difficulty}
                            className="transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
                          >
                            <label 
                              className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                                checked 
                                  ? getDifficultyColor(difficulty) 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <Checkbox 
                                checked={checked}
                                onCheckedChange={(checked) => 
                                  setDifficulties(prev => ({...prev, [difficulty]: checked}))
                                }
                                className={`mb-2 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white h-5 w-5`}
                              />
                              <span className="font-medium capitalize">{difficulty}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Leave all unchecked to include problems of all difficulty levels
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="count" className="mt-0">
                <Card className="border-0 shadow-none">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl text-blue-800">Number of Problems</CardTitle>
                    <CardDescription>
                      Choose how many problems to include in your quiz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <Select value={problemCount} onValueChange={setProblemCount}>
                      <SelectTrigger className="w-full bg-white border-2 border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                        <SelectValue placeholder="Select number of problems" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-blue-200 shadow-md">
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <SelectItem 
                            key={num} 
                            value={num.toString()}
                            className="hover:bg-blue-50"
                          >
                            {num} {num === 1 ? 'Problem' : 'Problems'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="py-4 flex justify-end">
            <div className="transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]">
              <Button 
                onClick={generateExam} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 text-lg font-medium rounded-xl shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}