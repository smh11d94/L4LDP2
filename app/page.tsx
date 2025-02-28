//page.tsx
"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import moment from 'moment';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import 'react-quill/dist/quill.bubble.css';
import { Button } from "@/components/ui/button";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Calendar } from './components/Calendar';
import { Problem } from './components/Problem';
import SupportContact from './components/SupportContact';
import ExamGenerator from "@/app/components/ExamGenerator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
Amplify.configure(outputs);
import { checkAdminGroups } from "./security/checkAdminGroups";
import Chat from './components/Chat';
import { Brain, MessageCircle, HelpCircle, LogOut , X} from 'lucide-react';


const client = generateClient<Schema>();

type Problem = Schema["Problem"]["type"];
type Bookmark = Schema["Bookmark"]["type"];
type Rating = Schema["Rating"]["type"];
type Note = Schema["Note"]["type"];

const ExamButton = () => (
  <Dialog>
    <ExamGenerator />
  </Dialog>
);

function App() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [problemDates, setProblemDates] = useState<Set<string>>(new Set());
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    const checkAdmin = async () => {
      const groups = await checkAdminGroups();
      setIsAdmin(Array.isArray(groups) && groups.includes('admin'));
    };
    checkAdmin();
  }, []);


  function ChatButton({ problem }: { problem: Problem | null }) {
    return (
      <>
      
        <Button 
          className="fixed bottom-4 left-6 bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-3 px-3 py-3 rounded-full shadow-lg transition-transform hover:scale-110 z-40"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle size={20}/>
          Chat About this Problem 
          
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-[0.12]"></span>
          <span className="relative inline-flex size-3 rounded-full bg-white"></span>

        </Button>
  
        {isChatOpen && (
          <div className="fixed bottom-20 left-6 w-[600px] h-4/5 bg-blue-300 rounded-xl drop-shadow-xl flex flex-col z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Math Problem Assistant</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-gray-100"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chat 
                problem={problem ? { id: problem.id, content: problem.content ?? "" } : null} 
              />
            </div>
          </div>
        )}
      </>
    );
  }

  useEffect(() => {
    if (user && ratings.length > 0 && problem) {
      fetchRating();
      fetchNote();
    }
  }, [user, ratings, problem, notes]);

  useEffect(() => {
    if (user) {
      listProblemDates()
        .then(() => fetchDailyProblem())
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

  async function listProblemDates() {
    try {
      const { data } = await client.models.Problem.list();
      const dates = new Set(data.map(p => p.publishDate).filter((date): date is string => date !== null));
      setProblemDates(dates);
    } catch (error) {
      console.error('Error listing problem dates:', error);
    }
  }

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
      
      const bookmarkMap: Record<string, Bookmark> = {};
      for (const bookmark of data) {
        if (bookmark.problemID) {
          const { data: problem } = await client.models.Problem.get({ id: bookmark.problemID });
        }
        if (problem?.publishDate) {
          bookmarkMap[problem.publishDate] = bookmark;
        }
      }
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
        setBookmarks(prev => prev.filter(b => b.id !== existingBookmark.id));
        setBookmarksByDate(prev => {
          const updated = { ...prev };
          delete updated[dateString];
          return updated;
        });
      } else {
        const { data: newBookmark } = await client.models.Bookmark.create({
          problemID: problem.id,
          owner: user.username
        });
        if (newBookmark) {
          setBookmarks(prev => [...prev, newBookmark]);
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
      const dateStr = selectedDate.format('YYYY-MM-DD');
      
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
        
        // Immediately update the ratingsByDate state
        setRatingsByDate(prev => ({
          ...prev,
          [dateStr]: rating
        }));
        
        setCurrentRating(rating);
      } else {
        const { data: newRating } = await client.models.Rating.create({
          rating,
          problemID: problem.id,
          date: now,
          owner: user.username
        });
        setRatings(prevRatings => [...prevRatings, newRating as Rating]);
        
        // Immediately update the ratingsByDate state
        setRatingsByDate(prev => ({
          ...prev,
          [dateStr]: rating
        }));
        
        setCurrentRating(rating);
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
    return new Set(Object.keys(bookmarksByDate));
  }, [bookmarksByDate]);

  return (
    <main>
      <header className="flex items-center justify-between pt-2 my-2">
        
        <img src="logo.png" alt="Logo" className="h-16 pl-6" />
        <div><h1 className="text-3xl font-bold">Welcome, {user?.signInDetails?.loginId}</h1></div>
        
          
          <div className="flex items-center gap-4 mx-4">
            <ExamButton />
            <ChatButton problem={problem ? {
                ...problem,
                content: problem.content || "",
              } : null} />
            
            <SupportContact />
          <Button className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-3 px-3 py-3 rounded transition-transform hover:scale-110" onClick={signOut} ><LogOut size={20}/>Sign Out </Button>
          
          </div>

        </header>
      <Card className="p-12 rounded-3xl max-w-[1600px] mx-auto">
        

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
              problemDates={problemDates}
              ratings={ratingsByDate}
              isAdmin={isAdmin}
            />
          </div>
          
          <div className="lg:col-span-5">
            <Problem
              problem={problem ? {
                ...problem,
                content: problem.content || "",
                hint: problem.hint || undefined,
                wSolution: problem.wSolution || undefined,
                vSolution: problem.vSolution || undefined
              } : null}
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
      </Card>
      <div className="p-6 flex justify-end">
  

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
