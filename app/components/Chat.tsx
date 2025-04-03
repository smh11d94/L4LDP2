// app/components/Chat.tsx
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { renderLatex } from './latexRender';
import { Send } from 'lucide-react';
import 'katex/dist/katex.min.css';
type Message = {
 role: 'user' | 'assistant';
 content: string;
}

type ChatProps = {
 problem: {
   id: string;
   content: string;
 } | null;
}



export default function Chat({ problem }: ChatProps) {
 const [messages, setMessages] = useState<Message[]>([]);
 const [input, setInput] = useState('');
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
   if (problem?.content) {
     setMessages([{ 
       role: 'user', 
       content: `${problem.content}` 
     }]);
   }
 }, [problem]);

 const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
  
    try {
        const response = await fetch('../api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'provide brief socratic conversation and help if there is a mistake. (no latex, do NOT reveal final answer)' },
                { role: 'system', content: `Context: ${problem?.content || ''}` },
                ...messages,
                userMessage
              ]
            })
          });
  
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

 return (
    <Card className="w-full max-w-3xl mx-auto p-4 rounded h-full bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="h-[calc(100%-4rem)] overflow-y-auto mb-4 border rounded p-4 bg-white">
       {messages.map((message, index) => (
         <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
           <div className={`inline-block p-2 rounded ${
             message.role === 'user' ? 'bg-blue-500 text-white text-left' : 'bg-green-100'
           }`}>
             <div className="prose dark:prose-invert max-w-none">
             {message.content?.split('\n').map((line, i) => (
  <div key={i} className="mb-4">
    {renderLatex(line)}
  </div>
))}
             </div>
           </div>
         </div>
       ))}
       {isLoading && <div className="text-gray-400">Typing...</div>}
     </div>
     <form onSubmit={sendMessage} className="flex gap-2">
       <input
         type="text"
         value={input}
         onChange={(e) => setInput(e.target.value)}
         className="flex-1 p-2 border rounded"
         placeholder="Ask a question about the problem..."
       />
       <Button className='bg-blue-100 rounded' type="submit" disabled={isLoading}>Send <Send className="w-4 h-4 mx-2" /></Button>
     </form>
   </Card>
 );
}
function setElementClass(arg0: string) {
    throw new Error('Function not implemented.');
}

