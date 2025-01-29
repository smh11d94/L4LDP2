import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from 'lucide-react';
import { useForm } from "react-hook-form";
import { useAuthenticator } from "@aws-amplify/ui-react";

type FormData = {
 subject: string;
 message: string;
};

export default function SupportContact() {
 const [isSending, setIsSending] = useState(false);
 const [isOpen, setIsOpen] = useState(false);
 const { user } = useAuthenticator();
 
 const {
   register,
   handleSubmit,
   reset,
   formState: { errors }
 } = useForm<FormData>();

 const onSubmit = async (data: FormData) => {
   setIsSending(true);
   
   try {
     const response = await fetch('/api/send-email', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         ...data,
         userEmail: user?.signInDetails?.loginId
       })
     });

     if (!response.ok) throw new Error('Failed to send');
     
     reset();
     setIsOpen(false);
     alert('Message sent successfully!');
   } catch (error) {
     console.error('Failed to send email:', error);
     alert('Failed to send message. Please try again.');
   } finally {
     setIsSending(false);
   }
 };

 return (
   <Dialog open={isOpen} onOpenChange={setIsOpen}>
     <DialogTrigger asChild>
       <Button className="bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-3 px-3 py-3 rounded transition-transform hover:scale-110">
         <HelpCircle size={20}/>Support
       </Button>
     </DialogTrigger>
     <DialogContent className="sm:max-w-[625px]">
       <DialogHeader>
         <DialogTitle>Contact Support</DialogTitle>
       </DialogHeader>
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
         <div className="space-y-2">
           <label className="text-sm font-medium">Subject</label>
           <Input
             {...register("subject", { required: true })}
             placeholder="Enter subject"
           />
           {errors.subject && (
             <span className="text-red-500 text-sm">Subject is required</span>
           )}
         </div>
         <div className="space-y-2">
           <label className="text-sm font-medium">Message</label>
           <Textarea
             {...register("message", { required: true })}
             placeholder="Enter your message"
             className="min-h-[100px]"
           />
           {errors.message && (
             <span className="text-red-500 text-sm">Message is required</span>
           )}
         </div>
         <div className="flex justify-end gap-3">
           <Button 
           className="rounded"
             type="button" 
             variant="outline" 
             onClick={() => {
               setIsOpen(false);
               reset();
             }}
           >
             Cancel
           </Button>
           <Button type="submit" disabled={isSending} className="bg-blue-700 text-white hover:text-black rounded">
             {isSending ? "Sending..." : "Send"}
           </Button>
         </div>
       </form>
     </DialogContent>
   </Dialog>
 );
}