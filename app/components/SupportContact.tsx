import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { HelpCircle, Send, User, Mail, X, Check } from 'lucide-react';
import { useForm } from "react-hook-form";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { toast } from "sonner";

type FormData = {
  subject: string;
  message: string;
};

export default function SupportContact() {
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuthenticator();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty }
  } = useForm<FormData>({
    mode: "onChange"
  });

  const userEmail = user?.signInDetails?.loginId || "Unknown user";

  const onSubmit = async (data: FormData) => {
    setIsSending(true);
    
    try {
      const response = await fetch('../api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userEmail
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.log('Error details:', result);
        const errorMessage = result.details?.[0]?.message || result.error || 'Unknown error';
        throw new Error(errorMessage);
      }
      
      reset();
      setSuccess(true);
      
      // Close dialog after showing success for 1.5 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1500);
      
      toast.success("Your message has been sent successfully!");
    } catch (error) {
      console.error('Failed to send email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset form and success state when closing the dialog
    setTimeout(() => {
      reset();
      setSuccess(false);
    }, 300); // Wait for dialog close animation
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button className="bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-3 px-3 py-3 rounded transition-transform hover:scale-110">
            <HelpCircle size={20}/>Support
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Message Sent!</DialogTitle>
            <DialogDescription className="text-center">
              Thank you for contacting support. We'll get back to you as soon as possible.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-700 text-white hover:bg-blue-800 flex items-center gap-3 px-3 py-3 rounded transition-transform hover:scale-110">
          <HelpCircle size={20}/>Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] p-0 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 relative">
          <button 
            onClick={handleClose} 
            className="absolute right-4 top-4 text-white hover:opacity-80 transition-opacity"
            aria-label="Close dialog"
          >
            <X className="h-7 w-7" />
          </button>
          <DialogHeader className="text-white mb-2">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold">Contact Support</DialogTitle>
            </div>
            <DialogDescription className="text-blue-50 opacity-90">
              Have a question or problem? Send us a message and we'll help you out.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">From</p>
              <p className="text-sm font-semibold">{userEmail}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Input
                {...register("subject", { required: "Please enter a subject" })}
                placeholder="What's your question about?"
                className="rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-300"
              />
              {errors.subject && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="h-4 w-4" /> {errors.subject.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <Textarea
                {...register("message", { 
                  required: "Please enter your message",
                  minLength: { value: 10, message: "Message must be at least 10 characters" }
                })}
                placeholder="Describe your issue or question in detail"
                className="min-h-[150px] rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-300"
              />
              {errors.message && (
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <X className="h-4 w-4" /> {errors.message.message}
                </span>
              )}
            </div>
            
            <DialogFooter className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="rounded px-4 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSending || !isValid || !isDirty} 
                className={`bg-blue-700 text-white hover:bg-blue-800 rounded px-5 flex items-center gap-2 ${
                  (!isValid || !isDirty) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}