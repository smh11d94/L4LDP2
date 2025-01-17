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
import Image from "next/image";

const WelcomeDialog = ({ totalProblems }: { totalProblems: number }) => {
  const [open, setOpen] = useState(true);

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
        <DialogFooter className="mt-6 flex justify-center">
          <Button className="rounded-xl text-lg py-5 transition-all duration-400 hover:scale-110 hover:bg-green-600 hover:text-white" onClick={() => setOpen(false)}>
            Start Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;