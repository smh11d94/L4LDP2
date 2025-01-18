//page.tsx
"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import moment from 'moment';
import { LogOut } from 'lucide-react';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import 'react-quill/dist/quill.bubble.css';
import { Button } from "@/components/ui/button";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Calendar } from './components/Calendar';
import { Problem } from './components/Problem';
import { getCurrentUser } from 'aws-amplify/auth';
import ExamGenerator from "@/app/components/ExamGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Problem = Schema["Problem"]["type"];
type Bookmark = Schema["Bookmark"]["type"];
type Rating = Schema["Rating"]["type"];
type Note = Schema["Note"]["type"];

const ExamButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Generate Custom Exam</Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Generate Custom Exam</DialogTitle>
      </DialogHeader>
      <ExamGenerator />
    </DialogContent>
  </Dialog>
);

function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingsByDate, setRatingsByDate] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
  const [currentMonth, setCurrentMonth] = useState<moment.Moment>(moment());
  const [currentNote, setCurrentNote] = useState<string>("");
  const [currentRating, setCurrentRating] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [bookmarksByDate, setBookmarksByDate] = useState<Record<string, Bookmark>>({});
  const { user, signOut } = useAuthenticator();

  
  useEffect(() => {
    if (user && ratings.length > 0 && problem) {
      fetchRating();
      fetchNote();
    }
  }, [user, ratings, problem , notes]);

  useEffect(() => {
    if (user) {
      fetchDailyProblem()
        .then(() => listBookmarks())
        .then(() => listRatings()) 
        .then(() => listNotes())
    }
   }, [user]);
  
  useEffect(() => {
    if (selectedDate) {
      fetchDailyProblem();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (problem) {
      fetchNote();
      fetchRating();
    }
  }, [problem]);
  
  async function fetchDailyProblem() {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const { data } = await client.models.Problem.list({
        filter: {
          publishDate: {
            eq: dateStr
          }
        }
      });
      
      if (data.length > 0) {
        setProblem(data[0]);
        await fetchNote();
      } else {
        setProblem(null);
      }
    } catch (error) {
      console.error('Error fetching daily problem:', error);
    }
  }
  
  async function listBookmarks() {
    try {
      const { data } = await client.models.Bookmark.list({
        filter: { owner: { eq: user?.username } }
      });
      setBookmarks(data);
      const bookmarkMap = data.reduce((acc, bookmark) => {
        if (bookmark.date) {
          acc[bookmark.date] = bookmark;
        }
        return acc;
      }, {} as Record<string, Bookmark>);
      setBookmarksByDate(bookmarkMap);
    } catch (error) {
      console.error('Error listing bookmarks:', error);
    }
  }
  
  async function listRatings() {
    try {
      const { data } = await client.models.Rating.list({ 
        filter: { owner: { eq: user?.username } } 
      });
      setRatings(data);
      
      const ratingMap: Record<string, 'easy' | 'medium' | 'hard'> = {};
      for (const rating of data) {
        if (rating.problemID) {
          const { data: problem } = await client.models.Problem.get({ id: rating.problemID });
          if (problem?.publishDate) {
            if (rating.rating !== null) {
              ratingMap[problem.publishDate] = rating.rating;
            }
          }
        }
        if (problem?.publishDate) {
          if (rating.rating !== null) {
            ratingMap[problem.publishDate] = rating.rating;
          }
        }
      }
      setRatingsByDate(ratingMap);
    } catch (error) {
      console.error('Error listing ratings:', error);
    }
  }
  
  async function listNotes() {
    try {
      const { data } = await client.models.Note.list({
        filter: { owner: { eq: user?.username } }
      });
      setNotes(data);
    } catch (error) {
      console.error('Error listing notes:', error);
    }
  }
  
  async function fetchNote() {
    if (!problem || !user?.username) {
      setCurrentNote("");
      return;
    }
    try {
      const existingNote = notes.find(n => n.problemID === problem.id && n.owner === user.username);
      setCurrentNote(existingNote && existingNote.content ? existingNote.content : "");
    } catch (error) {
      console.error('Error fetching note:', error);
      setCurrentNote("");
    }
  }

  async function fetchRating() {
    if (!problem || !user?.username) {
      setCurrentRating(null);
      return;
    }
    try {
      const existingRating = ratings.find(r => 
        r.problemID === problem.id && 
        r.owner === user.username
      );
      setCurrentRating(existingRating && existingRating.rating ? existingRating.rating : null);
    } catch (error) {
      console.error('Error fetching rating:', error);
      setCurrentRating(null);
    }
  }
  
  async function toggleBookmark() {
    if (!problem || !user?.username || isBookmarkLoading) return;
    
    setIsBookmarkLoading(true);
    const dateString = selectedDate.format('YYYY-MM-DD');
    const existingBookmark = bookmarksByDate[dateString];
    
    try {
      if (existingBookmark) {
        await client.models.Bookmark.delete({
          id: existingBookmark.id
        });
        
        setBookmarks(prevBookmarks => prevBookmarks.filter(b => b.id !== existingBookmark.id));
        setBookmarksByDate(prev => {
          const updated = { ...prev };
          delete updated[dateString];
          return updated;
        });
      } else {
        const { data: newBookmark } = await client.models.Bookmark.create({
          date: dateString,
          problemID: problem.id,
          owner: user.username
        });
        
        if (newBookmark) {
          setBookmarks(prevBookmarks => [...prevBookmarks, newBookmark]);
          setBookmarksByDate(prev => ({
            ...prev,
            [dateString]: newBookmark
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsBookmarkLoading(false);
    }
  }
  
  async function rateQuestion(rating: 'easy' | 'medium' | 'hard') {
    if (!problem || !user?.username) return;
    
    try {
      const existingRating = ratings.find(r => 
        r.problemID === problem.id && 
        r.owner === user.username
      );
      const now = new Date().toISOString();
      
      if (existingRating) {
        const updatedRating = await client.models.Rating.update({
          id: existingRating.id,
          rating,
          date: now,
          owner: user.username
        });
        setRatings(prevRatings => 
          prevRatings.map(r => r.id === existingRating.id ? { ...r, ...updatedRating } : r)
        );
        setCurrentRating(rating);
        await listRatings();
      } else {
        const { data: newRating } = await client.models.Rating.create({
          rating,
          problemID: problem.id,
          date: now,
          owner: user.username
        });
        setRatings(prevRatings => [...prevRatings, newRating as Rating]);
        setCurrentRating(rating);
        await listRatings();
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }
  
  async function saveNote(note: string) {
    if (!problem || !user?.username) return;
    
    setIsSaving(true);
    try {
      const existingNote = notes.find(n => 
        n.problemID === problem.id && 
        n.owner === user.username
      );
      const now = new Date().toISOString();
      
      if (existingNote) {
        const updatedNote = await client.models.Note.update({
          id: existingNote.id,
          content: note,
          updatedAt: now,
          owner: user.username
        });
        setNotes(prevNotes => 
          prevNotes.map(n => n.id === existingNote.id ? { ...n, ...updatedNote } : n)
        );
      } else {
        const { data: newNote } = await client.models.Note.create({
          content: note,
          problemID: problem.id,
          createdAt: now,
          updatedAt: now,
          owner: user.username
        });
        setNotes(prevNotes => [...prevNotes, newNote as Note]);
      }
      setCurrentNote(note);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  }



  const bookmarkedDates = useMemo(() => {
    return new Set(bookmarks.map(b => b.date).filter((date): date is string => date !== undefined));
  }, [bookmarks]);


  return (
    
    <main className="container mx-auto p-4 max-w-9x3 min-w-[320px]">
  
  <div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold">Welcome, {user?.signInDetails?.loginId}</h1>
  <div className="flex space-x-2">
    <ExamButton />
    <Button onClick={signOut} variant="outline">Sign Out</Button>
  </div>
</div>
  
  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-14">
    <h1 className="text-3xl font-bold">Daily Problems</h1>
    <div className="flex flex-col md:flex-row items-center gap-4">
      <span className="text-sm text-gray-600">Welcome!</span>
      <Button onClick={signOut} variant="ghost" size="sm" className="ml-auto">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
</div>
      
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-8">
        <div className="lg:col-span-3">
          <Calendar 
            currentMonth={currentMonth}
            selectedDate={selectedDate} 
            onSelectDate={(date, type) => {
              if (type === 'month') {
                setCurrentMonth(date);
              } else {
                setSelectedDate(date);
              }
            }} 
            bookmarkedDates={bookmarkedDates}
            ratings={ratingsByDate}
          />
        </div>
        
        <div className="lg:col-span-5">
          <Problem
            problem={problem ? { ...problem, content: problem.content || "", hint: problem.hint || undefined } : null}
            selectedDate={selectedDate}
            isBookmarked={bookmarkedDates.has(selectedDate.format('YYYY-MM-DD'))}
            currentRating={currentRating}
            isBookmarkLoading={isBookmarkLoading}
            onToggleBookmark={toggleBookmark}
            onRateQuestion={rateQuestion}
            currentNote={currentNote}
            onSaveNote={saveNote}
            isSaving={isSaving}
          />
        </div>
      </div>
    </main>
  );
}

export default function AuthenticatedApp() {
  return (
    <Authenticator>
      <App />
    </Authenticator>
  );
}