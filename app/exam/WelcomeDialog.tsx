import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const WelcomeDialog = ({ totalProblems, onTimerPreference }: { 
  totalProblems: number,
  onTimerPreference: (useTimer: boolean, minutes?: number) => void
}) => {
  const [open, setOpen] = useState(true);
  const [useTimer, setUseTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(totalProblems * 15); // Default 20 min per problem

  const handleTimerMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setTimerMinutes(value);
    }
  };

  const handleStart = () => {
    onTimerPreference(useTimer, useTimer ? timerMinutes : undefined);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:rounded-[1rem] max-w-lg [&>button]:hidden">
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Logo"
            width="300"
            height={300}
          />
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">Welcome to Quiz</DialogTitle>
          <DialogDescription className="text-lg">
            <div className='mb-3'>This quiz contains {totalProblems} problems.</div>
            <div>You can rate each problem's difficulty level which will be saved automatically for your future reference.</div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="timer" 
              checked={useTimer} 
              onCheckedChange={(checked) => setUseTimer(checked as boolean)} 
            />
            <Label htmlFor="timer" className="text-base">Use timer for this quiz</Label>
          </div>
          
          {useTimer && (
            <div className="pl-6 pt-2">
              <Label htmlFor="timerMinutes" className="block mb-2">Timer duration:</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="timerMinutes"
                  type="number"
                  min="1"
                  value={timerMinutes}
                  onChange={handleTimerMinutesChange}
                  className="w-24 bg-white border-2 border-blue-200 focus:border-blue-400"
                />
                <span className="text-gray-700">minutes</span>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6 flex justify-center">
          <Button 
            className="rounded-xl text-lg py-5 transition-all duration-400 hover:scale-110 hover:bg-green-600 hover:text-white" 
            onClick={handleStart}
          >
            Start Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;