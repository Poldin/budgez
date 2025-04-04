import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Bot, User } from 'lucide-react';
import TechBudgetScreen from '@/app/budgez/[id]/components/budget/compute_budget_section';
import aiService, { BudgetData, Message } from '@/services/ai-service';
import { toast } from "sonner";

const AiBudgetGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;

    // Add user message to conversation
    const userMessage: Message = { role: 'user', content: prompt };
    setConversation([...conversation, userMessage]);
    
    setLoading(true);
    try {
      // Call the AI service
      const { budget, message } = await aiService.generateBudget(prompt);
      
      // Set the budget data
      setBudgetData(budget);
      
      // Add assistant response to conversation
      const assistantResponse: Message = {
        role: 'assistant',
        content: message
      };
      
      setConversation(prev => [...prev, assistantResponse]);
    } catch (error) {
      console.error("Error generating budget with AI:", error);
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : "Failed to generate budget."}`
      }]);
      
      toast.error("Failed to generate budget. Please check the console for details.");
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleConversationUpdate = async (message: string) => {
    if (!message.trim() || !budgetData) return;
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    
    try {
      // Call the AI service to modify the budget
      const { updatedBudget, responseMessage } = await aiService.modifyBudget(
        message,
        budgetData
      );
      
      // Debug log to check if the budget was actually updated
      console.log('Budget before update:', JSON.stringify(budgetData, null, 2));
      console.log('Budget after update:', JSON.stringify(updatedBudget, null, 2));
      
      // Check if we have a valid budget structure
      if (!updatedBudget || !updatedBudget.section) {
        throw new Error('Received invalid budget structure from AI service');
      }
      
      // Update the budget data
      setBudgetData(updatedBudget);
      
      // Add assistant response to conversation
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: responseMessage
      }]);
    } catch (error) {
      console.error("Error updating budget:", error);
      setConversation(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : "Failed to update budget."}`
      }]);
      
      toast.error("Failed to update budget. Please check the console for details.");
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleBudgetUpdate = (data: BudgetData) => {
    console.log("Budget updated:", data);
    // This would sync updates from the Budget UI back to our state
    setBudgetData(data);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Initial prompt interface or conversation + budget */}
      {!budgetData ? (
        <div className="space-y-4 p-6 border rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h3>Generate Budget with AI</h3>
          </div>
          
          <p className="text-gray-600">
            Describe your project and I&apos;ll create a detailed budget structure with activities and resources.
          </p>
          
          <Textarea
            placeholder="E.g., Create a budget for a website development project with frontend and backend work, including UI design..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
          />
          
          <Button 
            onClick={handlePromptSubmit} 
            disabled={loading || !prompt.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Generating...' : 'Generate Budget Structure'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation panel */}
          <div className="border rounded-lg shadow-sm p-4 space-y-4">
            <h3 className="text-xl font-bold">Refine Your Budget</h3>
            
            <div className="h-[400px] overflow-y-auto space-y-4 p-2 bg-gray-50 rounded">
              {conversation.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex gap-3 ${
                    message.role === 'assistant' ? 'items-start' : 'items-start justify-end'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Bot className="h-5 w-5 text-purple-600" />
                    </div>
                  )}
                  
                  <div 
                    className={`p-3 rounded-lg max-w-[80%] ${
                      message.role === 'assistant' 
                        ? message.content.startsWith('Error:') 
                          ? 'bg-red-50 border border-red-200 text-red-700'
                          : 'bg-white border' 
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="bg-gray-200 p-2 rounded-full">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="p-3 rounded-lg max-w-[80%] bg-white border">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask to modify the budget..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => handleConversationUpdate(prompt)} 
                disabled={loading || !prompt.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            </div>
          
          {/* Budget component */}
          <div className="border rounded-lg shadow-sm">
            <TechBudgetScreen 
              initialData={budgetData}
              onUpdate={handleBudgetUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AiBudgetGenerator; 