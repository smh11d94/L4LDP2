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
    <div className="container max-w-7xl mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            <div className="space-y-2">
  <Label htmlFor="publishDate">Publish Date</Label>
  <DatePicker
  selected={publishDate ? new Date(publishDate + 'T00:00:00') : null}
  onChange={(date) => handleDateChange(date)}
  dateFormat="yyyy-MM-dd"
  className="w-full p-2 border rounded-md"
  highlightDates={datesWithProblems.map(date => new Date(date + 'T00:00:00'))}
  customInput={<Input />}
/>
</div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a course</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            

            <div className="space-y-2 md:col-span-5">
              <Label>Topics</Label>
              <div className="grid grid-cols-6 gap-4 border rounded-md p-4">
                {filteredTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center space-x-2">
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
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={topic.id} className="text-sm">
                      {topic.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            </div>
            <div className="space-y-2">
  <Label htmlFor="content">Problem Content</Label>
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
    className="bg-white min-h-[200px] mb-12"
  />
  
  {/* Preview Button */}
  <div className="flex justify-end mt-2">
    <Button
      type="button"
      variant="outline"
      onClick={() => setShowPreview(!showPreview)}
      className="mb-4"
    >
      {showPreview ? 'Hide Preview' : 'Show Preview'}
    </Button>
  </div>

{/* Preview Section */}
{showPreview && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle className="text-lg">Preview</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="latex-render">
        {renderLatex(content)}
      </div>
    </CardContent>
  </Card>
)}
</div>

            

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hint">Hint</Label>
              <Textarea
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                rows={3}
                placeholder="Optional hint for the problem"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="wSolution">Written Solution Link</Label>
    <Input
      type="url"
      id="wSolution"
      value={wSolution}
      onChange={(e) => setWSolution(e.target.value)}
      placeholder="https://example.com/written-solution"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="vSolution">Video Solution Link</Label>
    <Input
      type="url"
      id="vSolution"
      value={vSolution}
      onChange={(e) => setVSolution(e.target.value)}
      placeholder="https://example.com/video-solution"
    />
  </div>
</div>
<div className="flex items-center gap-14 justify-end">  
<div className="flex items-center gap-3 bg-red-200   p-3 rounded">
  <input
    type="checkbox"
    id="confirmChanges"
    checked={confirmChanges}
    onChange={(e) => setConfirmChanges(e.target.checked)}
    className="h-4 w-4 rounded border-gray-300 "
  />
  <Label htmlFor="confirmChanges" className="text-base">
    I confirm that I want to {existingProblem ? 'update' : 'create'} this problem
  </Label>
</div>

            <Button 
              type="submit" 
              className="w-2/5 bg-blue-200 rounded p-6"
              disabled={isSubmitting || !confirmChanges || !content.trim()}
            >
              {isSubmitting ? 'Saving...' : (existingProblem ? 'Update Problem' : 'Create Problem')}
            </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}