
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
 
type CalendarProps = {
  currentMonth: moment.Moment;
  selectedDate: moment.Moment;
  onSelectDate: (date: moment.Moment, type: 'day' | 'month') => void;
  bookmarkedDates: Set<string>;
  ratings: Record<string, 'easy' | 'medium' | 'hard'>;
};

export const Calendar: React.FC<CalendarProps> = ({
  currentMonth,
  selectedDate,
  onSelectDate,
  bookmarkedDates,
  ratings
}) => {
  const startDay = currentMonth.clone().startOf('month').startOf('week');
  const endDay = currentMonth.clone().endOf('month').endOf('week');
  
  const calendar = [];
  const day = startDay.clone();
  
  while (day.isBefore(endDay, 'day')) {
    calendar.push(
      Array(7).fill(0).map(() => {
        const clonedDate = day.clone();
        day.add(1, 'day');
        return clonedDate;
      })
    );
  }

  const getDayStyle = (date: moment.Moment, isSelected: boolean, isCurrentMonth: boolean) => {
    const dateString = date.format('YYYY-MM-DD');
    const rating = ratings[dateString];
    const isToday = date.isSame(moment(), 'day');
    const hasProblem = rating !== undefined;
    const isFutureDate = date.isAfter(moment(), 'day');
    
    return cn(
      "relative cursor-pointer rounded-xl transition-all duration-200",
      "flex flex-col items-center justify-center",
      "w-12 h-12 md:w-16 md:h-16",
      {
        'text-muted-foreground': !isCurrentMonth || !hasProblem,
        'bg-primary/5 dark:bg-primary/10': isToday,
        'bg-emerald-100 dark:bg-emerald-900/30': rating === 'easy',
        'bg-amber-100 dark:bg-amber-900/30': rating === 'medium',
        'bg-rose-100 dark:bg-rose-900/30': rating === 'hard',
        'opacity-50': !hasProblem,
        'pointer-events-none opacity-30': isFutureDate
      },
      !isFutureDate && "hover:scale-105 hover:shadow-md",
      isFutureDate && "cursor-not-allowed opacity-30",
      isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background"
    );
  };

  const getRatingDot = (rating?: 'easy' | 'medium' | 'hard') => {
    if (!rating) return null;
    
    const colors = {
      easy: 'bg-emerald-500',
      medium: 'bg-amber-500',
      hard: 'bg-rose-500'
    };

    return (
      <div className={cn(
        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
        colors[rating]
      )} />
    );
  };
  
  return (
    <Card className="calendar w-full max-w-3xl mx-auto bg-card rounded-3xl overflow-hidden">
      <CardHeader className="space-y-6 pb-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => onSelectDate(currentMonth.clone().subtract(1, 'month'), 'month')}
            variant="ghost"
            size="lg"
            className="hover:bg-primary/10"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {currentMonth.format('MMMM YYYY')}
          </CardTitle>
          <Button
            onClick={() => onSelectDate(currentMonth.clone().add(1, 'month'), 'month')}
            variant="ghost"
            size="lg"
            className="hover:bg-primary/10"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {calendar.flat().map(day => {
            const dateString = day.format('YYYY-MM-DD');
            const isSelected = day.isSame(selectedDate, 'day');
            const isCurrentMonth = day.isSame(currentMonth, 'month');
            const isBookmarked = bookmarkedDates.has(dateString);
            
            return (
              <div
                key={dateString}
                onClick={() => onSelectDate(day, 'day')}
                className={getDayStyle(day, isSelected, isCurrentMonth)}
              >
                <span className={cn(
                  "text-sm font-medium z-10",
                  isBookmarked && "font-bold"
                )}>
                  {day.format('D')}
                </span>
                {getRatingDot(ratings[dateString])}
                {isBookmarked && (
                  <BookmarkIcon 
                    className="absolute top-1 right-1 w-3 h-3 text-primary" 
                    fill="currentColor"
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};