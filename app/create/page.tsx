"use client";

import { useState, useEffect } from 'react';
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';   
import "@aws-amplify/ui-react/styles.css";
import 'react-quill/dist/quill.bubble.css';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { CustomQuill } from '../exam/LatexRenderer';
import "./global.css";
import {renderLatex} from "../components/latexRender";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment-timezone';

Amplify.configure(outputs);

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
const client = generateClient<Schema>();

export default function CreateProblem() {
  const [showPreview, setShowPreview] = useState(false);
  const [showHintPreview, setShowHintPreview] = useState(false);
  const [content, setContent] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [hint, setHint] = useState('');
  const [tags, setTags] = useState('');
  const [wSolution, setWSolution] = useState('');
  const [vSolution, setVSolution] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Array<{
    courseID: string;
    id: string;
    name: string;
  }>>([]);
  const [availableCourses, setAvailableCourses] = useState<Array<{id: string, name: string}>>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProblem, setExistingProblem] = useState<any>(null);
  const [confirmChanges, setConfirmChanges] = useState(false);
  const { user } = useAuthenticator();
  const [datesWithProblems, setDatesWithProblems] = useState<string[]>([]);
  
  // AI problem generation states
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [subject, setSubject] = useState('');
  const [problemIdea, setProblemIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AI hint generation states
  const [showAIHintGeneration, setShowAIHintGeneration] = useState(false);
  const [hintLevel, setHintLevel] = useState<'subtle' | 'medium' | 'detailed'>('medium');
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  useEffect(() => {
    const fetchExistingProblemDates = async () => {
      try {
        const response = await client.models.Problem.list();
        const dates = response.data
          .map(problem => problem.publishDate)
          .filter(date => date !== null) as string[];
        setDatesWithProblems(dates);
      } catch (error) {
        toast.error("Failed to load problem dates");
      }
    };
   
    const fetchCoursesAndTopics = async () => {
      try {
        const coursesResponse = await client.models.Course.list();
        const topicsResponse = await client.models.Topic.list();
        
        setAvailableCourses(coursesResponse.data.map(course => ({
          id: course.id,
          name: course.name || ''
        })));
        
        setAvailableTopics(topicsResponse.data.map(topic => ({
          id: topic.id,
          name: topic.name || '',
          courseID: topic.courseID || ''
        })));
      } catch (error) {
        toast.error("Failed to load courses and topics");
      }
    };
   
    fetchExistingProblemDates();
    fetchCoursesAndTopics();
   }, []);

  const handleDateChange = async (date: Date | null) => {
    if (!date) {
      setPublishDate('');
    }
    const utcDate = moment(date).format('YYYY-MM-DD');
  setPublishDate(utcDate);
  setConfirmChanges(false);
  // Reset course selection immediately when date changes
  setSelectedCourse('');
  
  try {
    const response = await client.models.Problem.list({
      filter: { publishDate: { eq: utcDate } }
    });
    
    if (response.data.length > 0) {
      const problem = response.data[0];
      setExistingProblem(problem);
      setContent(problem.content || '');
      setHint(problem.hint || '');
      setTags(problem.tags?.join(', ') || '');
      setWSolution(problem.wSolution || '');
      setVSolution(problem.vSolution || '');
      
      // Fetch problem topics
      const problemTopics = await client.models.ProblemTopic.list({
        filter: { problemID: { eq: problem.id } }
      });
      
      setSelectedTopics(problemTopics.data.map(pt => pt.topicID));
      
      // Only set course if there are topics
      if (problemTopics.data.length > 0) {
        const firstTopicId = problemTopics.data[0].topicID;
        const topic = availableTopics.find(t => t.id === firstTopicId);
        if (topic) {
          setSelectedCourse(topic.courseID);
        }
      }
      
      toast.info('Existing problem loaded for this date');
    } else {
      setExistingProblem(null);
      setContent('');
      setHint('');
      setTags('');
      setWSolution('');
      setVSolution('');
      setSelectedTopics([]);
    }
  } catch (error) {
    toast.error('Failed to check for existing problem');
  }
};

const fetchExistingProblemDates = async () => {
  try {
    const response = await client.models.Problem.list();
    const dates = response.data
      .map(problem => problem.publishDate)
      .filter(date => date !== null) as string[];
    setDatesWithProblems(dates);
  } catch (error) {
    toast.error("Failed to load problem dates");
  }
};

  const filteredTopics = selectedCourse
    ? availableTopics.filter(topic => topic.courseID === selectedCourse)
    : availableTopics;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
        toast.error('You must be logged in to create a problem');
        return;
      }
      if (!content.trim() || !publishDate) {
        toast.error('Please fill in all required fields');
        return;
      }
     
      setIsSubmitting(true);
      try {
        const problemData = {
          content,
          hint: hint || null,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          wSolution: wSolution || null,
          vSolution: vSolution || null,
          updatedAt: new Date().toISOString(),
        };
     
        if (existingProblem) {
          await client.models.Problem.update({
            id: existingProblem.id,
            ...problemData,
          });
     
          const currentTopics = await client.models.ProblemTopic.list({
            filter: { problemID: { eq: existingProblem.id } }
          });
          
          // Remove old topics
          for (const topic of currentTopics.data) {
            if (!selectedTopics.includes(topic.topicID)) {
              await client.models.ProblemTopic.delete({ id: topic.id });
            }
          }
          
          // Add new topics
          const existingTopicIds = currentTopics.data.map(t => t.topicID);
          for (const topicId of selectedTopics) {
            if (!existingTopicIds.includes(topicId)) {
              await client.models.ProblemTopic.create({
                problemID: existingProblem.id,
                topicID: topicId,
              });
            }
          }
     
          toast.success('Problem updated successfully');
        } else {
          const newProblem = await client.models.Problem.create({
            ...problemData,
            publishDate,
            createdAt: new Date().toISOString(),
          });
     
          if (selectedTopics.length > 0 && newProblem?.data?.id) {
            for (const topicId of selectedTopics) {
              await client.models.ProblemTopic.create({
                problemID: newProblem.data.id,
                topicID: topicId,
              });
            }
          }
     
          setExistingProblem(newProblem.data);
          toast.success('Problem created successfully');
        }
        
        await fetchExistingProblemDates();
      } catch (error) {
        toast.error(existingProblem ? 'Failed to update problem' : 'Failed to create problem');
      } finally {
        setIsSubmitting(false);
      }
     };

  // Function to generate problem using AI
  const generateAIProblem = async () => {
    if (!subject.trim() || !problemIdea.trim()) {
      toast.error('Please provide both subject and problem idea');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          problemIdea: problemIdea.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error:', errorData || response.statusText);
        throw new Error('Failed to generate problem');
      }

      const data = await response.json();
      
      // Set the generated problem to the content field
      setContent(data.problem);
      
      // Auto-set tags from subject
      if (!tags && subject) {
        setTags(subject);
      }
      
      toast.success('Problem generated successfully!');
      // Close the AI generation panel
      setShowAIGeneration(false);
    } catch (error) {
      console.error('Error generating problem:', error);
      toast.error('Failed to generate problem. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to generate hint using AI
  const generateAIHint = async () => {
    if (!content.trim()) {
      toast.error('Please ensure problem content is filled before generating a hint');
      return;
    }

    setIsGeneratingHint(true);
    try {
      const response = await fetch('/api/generate-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem: content.trim(),
          hintLevel: hintLevel
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error:', errorData || response.statusText);
        throw new Error('Failed to generate hint');
      }

      const data = await response.json();
      
      // Set the generated hint to the hint field
      setHint(data.hint);
      
      toast.success('Hint generated successfully!');
      // Close the AI generation panel
      setShowAIHintGeneration(false);
    } catch (error) {
      console.error('Error generating hint:', error);
      toast.error('Failed to generate hint. Please try again.');
    } finally {
      setIsGeneratingHint(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Please log in to create problems</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-16 pb-12">
      {/* Fixed Ribbon Header */}
      <div className="fixed top-0 left-0 right-0 z-10 w-full bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg border-b border-indigo-800 rounded-b-lg">
        <div className="flex items-center h-16 px-6 justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {existingProblem ? 'Update Problem' : 'Create New Problem'}
          </h1>
          <div className="hidden md:block mr-6">
            <span className="text-white text-md md:text-lg font-medium bg-indigo-800 px-3 py-1 rounded-full">
              {publishDate ? `For ${publishDate}` : 'Not scheduled'}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 w-[85%]">
        <Card className="border-0 shadow-xl overflow-hidden rounded-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date, Course and Topics section */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Problem Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <Label htmlFor="publishDate" className="text-blue-700 font-medium text-sm">Publish Date</Label>
                      <DatePicker
                        selected={publishDate ? new Date(publishDate + 'T00:00:00') : null}
                        onChange={(date) => handleDateChange(date)}
                        dateFormat="yyyy-MM-dd"
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        highlightDates={datesWithProblems.map(date => new Date(date + 'T00:00:00'))}
                        customInput={<Input className="border-blue-200 rounded-lg" />}
                        placeholderText="Select date..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="course" className="text-blue-700 font-medium text-sm">Course</Label>
                      <select
                        id="course"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        <option value="">Select a course</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-8">
                    <div className="flex justify-between items-center">
                      <Label className="text-blue-700 font-medium">Topics</Label>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {selectedTopics.length} selected
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-blue-200 rounded-xl p-3 bg-white">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
                        {filteredTopics.length > 0 ? (
                          filteredTopics.map((topic) => (
                            <div key={topic.id} className="flex items-center space-x-2 p-1 hover:bg-blue-50 rounded-lg truncate">
                              <input
                                type="checkbox"
                                id={topic.id}
                                checked={selectedTopics.includes(topic.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTopics([...selectedTopics, topic.id]);
                                  } else {
                                    setSelectedTopics(selectedTopics.filter(id => id !== topic.id));
                                  }
                                }}
                                className="h-4 w-4 flex-shrink-0 rounded-lg text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <label htmlFor={topic.id} className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                {topic.name}
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-4 text-gray-500">
                            {selectedCourse ? "No topics found for this course" : "Please select a course to view topics"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Content with improved styling */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-md p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Problem Content
                  </h2>
                  
                  {/* AI Problem Generation Toggle Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAIGeneration(!showAIGeneration)}
                    className="bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white font-medium px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {showAIGeneration ? '✕ Hide AI Generation' : '✨ Generate Problem with AI'}
                  </Button>
                </div>

                {/* AI Problem Generation Panel */}
                {showAIGeneration && (
                  <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-purple-100">
                      <CardTitle className="text-lg text-indigo-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Problem Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-indigo-700">Subject/Topic</Label>
                        <Input
                          type="text"
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g., Integral Calculus, Probability, Linear Algebra"
                          className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="problemIdea" className="text-indigo-700">Problem Idea</Label>
                        <Textarea
                          id="problemIdea"
                          value={problemIdea}
                          onChange={(e) => setProblemIdea(e.target.value)}
                          rows={3}
                          placeholder="Describe what kind of problem you want to generate"
                          className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-lg"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={generateAIProblem}
                        disabled={isGenerating || !subject.trim() || !problemIdea.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {isGenerating ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Problem...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Generate Problem
                          </span>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-4">
                  <Label htmlFor="content" className="text-gray-700 font-medium">Write or edit your problem below</Label>
                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <ReactQuill 
                      value={content} 
                      onChange={setContent}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          ['blockquote', 'code-block'],
                          [{'list': 'ordered'}, {'list': 'bullet'}],
                          ['link', 'formula'],
                          ['clean']
                        ],
                      }}
                      className="bg-white"
                      style={{ height: '300px' }}
                    />
                  </div>
                  
                  {/* Preview Button */}
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                      className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-medium rounded-xl transition-colors"
                    >
                      {showPreview ? (
                        <span className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Hide Preview
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Problem
                        </span>
                      )}
                    </Button>
                  </div>

                  {/* Preview Section */}
                  {showPreview && (
                    <Card className="mt-4 border border-blue-200 bg-blue-50 rounded-xl overflow-hidden">
                      <CardHeader className="bg-blue-100 border-b border-blue-200 pb-2">
                        <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Problem Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4">
                        <div className="latex-render bg-white p-4 rounded-xl border border-gray-200 shadow-inner">
                          <CustomQuill value={content} readOnly={true} preserveFormulas={true} />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Additional Information (tags, hint, solutions) */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Additional Information
                </h2>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-gray-700 font-medium flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Tags (comma-separated)
                    </Label>
                    <Input
                      type="text"
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="calculus, integration, area_under_curve"
                      className="border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="hint" className="text-gray-700 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Hint (Optional)
                      </Label>
                      
                      {/* AI Hint Generation Toggle Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAIHintGeneration(!showAIHintGeneration)}
                        className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-medium px-6 py-1 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm"
                      >
                        {showAIHintGeneration ? '✕ Hide' : '✨ Generate Hint with AI'}
                      </Button>
                    </div>
                    
                    {/* AI Hint Generation Panel */}
                    {showAIHintGeneration && (
                      <Card className="mb-6 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md rounded-xl overflow-hidden">
                        <CardHeader className="border-b border-amber-100">
                          <CardTitle className="text-lg text-amber-700 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Hint Generation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-amber-700">Hint Level</Label>
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="subtle"
                                  name="hintLevel"
                                  value="subtle"
                                  checked={hintLevel === 'subtle'}
                                  onChange={() => setHintLevel('subtle')}
                                  className="h-4 w-4 text-amber-600 border-amber-300 focus:ring-amber-500"
                                />
                                <label htmlFor="subtle" className="text-sm text-amber-800">
                                  Subtle Hint <span className="text-xs text-amber-600">(Gentle nudge in the right direction)</span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="medium"
                                  name="hintLevel"
                                  value="medium"
                                  checked={hintLevel === 'medium'}
                                  onChange={() => setHintLevel('medium')}
                                  className="h-4 w-4 text-amber-600 border-amber-300 focus:ring-amber-500"
                                />
                                <label htmlFor="medium" className="text-sm text-amber-800">
                                  Medium Hint <span className="text-xs text-amber-600">(Suggest approaches and equations)</span>
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="detailed"
                                  name="hintLevel"
                                  value="detailed"
                                  checked={hintLevel === 'detailed'}
                                  onChange={() => setHintLevel('detailed')}
                                  className="h-4 w-4 text-amber-600 border-amber-300 focus:ring-amber-500"
                                />
                                <label htmlFor="detailed" className="text-sm text-amber-800">
                                  Detailed Hint <span className="text-xs text-amber-600">(Step-by-step guidance without full solution)</span>
                                </label>
                              </div>
                            </div>
                            <p className="text-xs text-amber-600 mt-2">
                              Make sure you've entered the problem content above before generating a hint.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={generateAIHint}
                            disabled={isGeneratingHint || !content.trim()}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            {isGeneratingHint ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Hint...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Generate Hint
                              </span>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Textarea
                      id="hint"
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      rows={3}
                      placeholder="Optional hint for students who are stuck"
                      className="border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                    />
                    
                    {/* Hint Preview Button - Only shows when hint has content */}
                    {hint.trim() && (
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowHintPreview(!showHintPreview)}
                          className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-medium rounded-xl transition-colors"
                          size="sm"
                        >
                          {showHintPreview ? (
                            <span className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Hide Hint Preview
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Preview Hint
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Hint Preview Section */}
                    {showHintPreview && hint.trim() && (
                      <Card className="mt-3 border border-amber-200 bg-amber-50 rounded-xl overflow-hidden">
                        <CardHeader className="bg-amber-100 border-b border-amber-200 pb-2">
                          <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Hint Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3">
                          <div className="latex-render bg-white p-3 rounded-xl border border-gray-200 shadow-inner">
                            <CustomQuill value={hint} readOnly={true} preserveFormulas={true} />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="wSolution" className="text-gray-700 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Written Solution Link
                      </Label>
                      <Input
                        type="url"
                        id="wSolution"
                        value={wSolution}
                        onChange={(e) => setWSolution(e.target.value)}
                        placeholder="https://example.com/written-solution"
                        className="border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vSolution" className="text-gray-700 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video Solution Link
                      </Label>
                      <Input
                        type="url"
                        id="vSolution"
                        value={vSolution}
                        onChange={(e) => setVSolution(e.target.value)}
                        placeholder="https://example.com/video-solution"
                        className="border-gray-300 focus:border-blue-400 focus:ring-blue-400 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit section with improved styling */}
              <div className="flex flex-col md:flex-row gap-6 items-center justify-between mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 bg-orange-100 p-4 rounded-xl border border-orange-200 w-full md:w-auto">
                  <input
                    type="checkbox"
                    id="confirmChanges"
                    checked={confirmChanges}
                    onChange={(e) => setConfirmChanges(e.target.checked)}
                    className="h-5 w-5 rounded-lg text-blue-600 border-orange-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="confirmChanges" className="text-base text-orange-800 font-medium">
                    I confirm that I want to {existingProblem ? 'update' : 'create'} this problem
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-1/3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isSubmitting || !confirmChanges || !content.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    existingProblem ? 'Update Problem' : 'Create Problem'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}