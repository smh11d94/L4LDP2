import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { Card } from "@/components/ui/card";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { toast } from 'sonner';
import { renderLatex } from '../components/latexRender';

const client = generateClient<Schema>();

const stripHtml = (html: string) => {
 if (typeof window === 'undefined') return html;
 const doc = new DOMParser().parseFromString(html, 'text/html');
 return doc.body.textContent || "";
};

interface Problem {
 id: string;
 content: string;
 publishDate: string;
 hint?: string;
 tags?: string[];
 topics?: Array<{
   id: string;
   topic: {
     name: string;
   };
 }>;
 rating?: {
   rating: 'easy' | 'medium' | 'hard';
 };
}

interface DaySlot {
 date: Date;
 problems: Problem[];
}

interface MonthData {
 [key: string]: DaySlot[];
}

interface ProblemCalendarProps {
 problems: Problem[];
 onProblemMove: (problemId: string, newDate: string) => Promise<void>;
}

const ProblemCalendar: React.FC<ProblemCalendarProps> = ({ problems, onProblemMove }) => {
 const [calendarData, setCalendarData] = useState<MonthData>({});
 const [currentViewMonth, setCurrentViewMonth] = useState(format(new Date(), 'yyyy-MM'));

 const generateMonthData = (baseMonth: string) => {
   const monthStart = startOfMonth(parseISO(`${baseMonth}-01`));
   const monthEnd = endOfMonth(monthStart);
   const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

   return days.map(day => ({
     date: day,
     problems: problems.filter(p => 
       format(parseISO(p.publishDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
     )
   }));
 };

 useEffect(() => {
   const currentMonthDate = parseISO(`${currentViewMonth}-01`);
   const nextMonthDate = addMonths(currentMonthDate, 1);
   
   const newCalendarData: MonthData = {
     [currentViewMonth]: generateMonthData(currentViewMonth),
     [format(nextMonthDate, 'yyyy-MM')]: generateMonthData(format(nextMonthDate, 'yyyy-MM'))
   };

   setCalendarData(newCalendarData);
 }, [problems, currentViewMonth]);

 const deleteProblem = async (problemId: string) => {
   const userInput = prompt("Type 'delete' to confirm deletion:");
   if (userInput === 'delete') {
     try {
       await client.models.Problem.delete({ id: problemId });
       setCalendarData(prevData => {
         const newData = {...prevData};
         Object.keys(newData).forEach(month => {
           newData[month] = newData[month].map(day => ({
             ...day,
             problems: day.problems.filter(p => p.id !== problemId)
           }));
         });
         return newData;
       });
       toast.success("Problem deleted successfully");
     } catch (error) {
       toast.error("Failed to delete problem");
     }
   }
 };

 const navigateMonth = (direction: 'prev' | 'next') => {
   const current = parseISO(`${currentViewMonth}-01`);
   const newDate = direction === 'next' 
     ? format(new Date(current.setMonth(current.getMonth() + 1)), 'yyyy-MM')
     : format(new Date(current.setMonth(current.getMonth() - 1)), 'yyyy-MM');
   setCurrentViewMonth(newDate);
 };

 const onDragEnd = async (result: any) => {
   if (!result.destination) return;

   const { source, destination, draggableId } = result;
   const [sourceMonth, sourceDay] = source.droppableId.split('_');
   const [destMonth, destDay] = destination.droppableId.split('_');
   
   const newDate = format(parseISO(`${destMonth}-${destDay}`), 'yyyy-MM-dd');

   const newCalendarData = {...calendarData};
   const sourceDaySlot = newCalendarData[sourceMonth].find(
     slot => format(slot.date, 'dd') === sourceDay
   );
   const destDaySlot = newCalendarData[destMonth].find(
     slot => format(slot.date, 'dd') === destDay
   );

   if (sourceDaySlot && destDaySlot) {
     const [problem] = sourceDaySlot.problems.splice(source.index, 1);
     if (problem) {
       destDaySlot.problems.splice(destination.index, 0, {
         ...problem,
         publishDate: newDate
       });
     }
   }

   setCalendarData(newCalendarData);
   
   try {
     await onProblemMove(draggableId, newDate);
   } catch (error) {
     setCalendarData({...calendarData});
   }
 };

 return (
   <DragDropContext onDragEnd={onDragEnd}>
     <div className="flex justify-between items-center mb-4">
       <button 
         onClick={() => navigateMonth('prev')}
         className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
       >
         Previous Month
       </button>
       <button 
         onClick={() => navigateMonth('next')}
         className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
       >
         Next Month
       </button>
     </div>
     <div className="grid grid-cols-2 gap-4">
       {Object.entries(calendarData).map(([month, days]) => (
         <Card key={month} className="mb-6">
           <h2 className="text-xl font-bold p-4 border-b">
             {format(parseISO(`${month}-01`), 'MMMM yyyy')}
           </h2>
           <div className="grid grid-cols-7 gap-3 p-3">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
               <div key={day} className="text-sm font-semibold text-gray-500">
                 {day}
               </div>
             ))}
             {Array.from({ length: days[0].date.getDay() }).map((_, index) => (
               <div key={`empty-${index}`} className="h-22 bg-gray-50 rounded" />
             ))}
             {days.map(daySlot => (
               <Droppable
                 key={format(daySlot.date, 'yyyy-MM-dd')}
                 droppableId={`${month}_${format(daySlot.date, 'dd')}`}
               >
                 {(provided, snapshot) => (
                   <div
                     ref={provided.innerRef}
                     {...provided.droppableProps}
                     className={`h-22 w-16 p-2 rounded border ${
                       snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'
                     }`}
                   >
                     <div className="text-sm text-gray-600 mb-2">
                       {format(daySlot.date, 'd')}
                     </div>
                     {daySlot.problems.map((problem, index) => (
                       <Draggable
                         key={problem.id}
                         draggableId={problem.id}
                         index={index}
                       >
                         {(provided) => (
                           <div
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           className="bg-white p-2 mb-1 rounded shadow-sm hover:shadow-md transition-shadow border text-sm relative group"
                           onDoubleClick={() => deleteProblem(problem.id)}
                          >
                           <div className="truncate">
                             {stripHtml(problem.content)}
                           </div>
                           <div className="hidden group-hover:block absolute z-10 bg-white border p-2 rounded shadow-lg min-w-[200px] max-w-[400px] whitespace-normal left-full ml-2">
                             {renderLatex(stripHtml(problem.content))}
                           </div>
                          </div>
                         )}
                       </Draggable>
                     ))}
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
             ))}
           </div>
         </Card>
       ))}
     </div>
   </DragDropContext>
 );
};

export default ProblemCalendar;