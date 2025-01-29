import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";

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

  useEffect(() => {
    // Get unique months from problems
    const months = [...new Set(problems.map(p => 
      format(parseISO(p.publishDate), 'yyyy-MM')
    ))];

    // Add current month if not in problems
    const currentMonth = format(new Date(), 'yyyy-MM');
    if (!months.includes(currentMonth)) {
      months.push(currentMonth);
    }

    // Sort months
    months.sort();

    // Create calendar data with all days
    const newCalendarData: MonthData = {};
    
    months.forEach(month => {
      const monthStart = startOfMonth(parseISO(`${month}-01`));
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

      newCalendarData[month] = days.map(day => ({
        date: day,
        problems: problems.filter(p => 
          format(parseISO(p.publishDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        )
      }));
    });

    setCalendarData(newCalendarData);
  }, [problems]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const [sourceMonth, sourceDay] = source.droppableId.split('_');
    const [destMonth, destDay] = destination.droppableId.split('_');
    
    const newDate = format(parseISO(`${destMonth}-${destDay}`), 'yyyy-MM-dd');

    // Update UI optimistically
    const newCalendarData = {...calendarData};
    const sourceDaySlot = newCalendarData[sourceMonth].find(
      slot => format(slot.date, 'dd') === sourceDay
    );
    const destDaySlot = newCalendarData[destMonth].find(
      slot => format(slot.date, 'dd') === destDay
    );

    if (sourceDaySlot && destDaySlot) {
      const [problem] = sourceDaySlot.problems.splice(
        source.index,
        1
      );
      
      if (problem) {
        destDaySlot.problems.splice(destination.index, 0, {
          ...problem,
          publishDate: newDate
        });
      }
    }

    setCalendarData(newCalendarData);
    
    // Update backend
    try {
      await onProblemMove(draggableId, newDate);
    } catch (error) {
      // Revert UI on error
      setCalendarData({...calendarData});
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {Object.entries(calendarData).map(([month, days]) => (
        <Card key={month} className="mb-6">
          <h2 className="text-xl font-bold p-4 border-b">
            {format(parseISO(`${month}-01`), 'MMMM yyyy')}
          </h2>
          <div className="grid grid-cols-7 gap-4 p-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-sm font-semibold text-gray-500">
                {day}
              </div>
            ))}
            {/* Add empty slots for days before the first of the month */}
            {Array.from({ length: days[0].date.getDay() }).map((_, index) => (
              <div key={`empty-${index}`} className="h-32 bg-gray-50 rounded" />
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
                    className={`h-32 p-2 rounded border ${
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
                            className="bg-white p-2 mb-1 rounded shadow-sm hover:shadow-md transition-shadow border text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {problem.rating && (
                                <span className={`w-2 h-2 rounded-full ${
                                  problem.rating.rating === 'easy' ? 'bg-green-500' :
                                  problem.rating.rating === 'medium' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} />
                              )}
                              <div className="truncate">
                                {problem.content.replace(/<[^>]*>/g, '')}
                              </div>
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
    </DragDropContext>
  );
};

export default ProblemCalendar;