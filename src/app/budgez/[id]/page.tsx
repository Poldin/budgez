//page.tsx - Pagina di creazione e modifica del budget
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import External from "./components/external"
import BudgetLogs from './components/stats/logs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Brief from "./components/brief";
import SimpleBudget from "./components/budget/SimpleBudget";
import TechBudget from "./components/budget/TechBudget";
import debounce from "lodash/debounce";
import ShareDialog from './components/share';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  file: File | null;
  name: string;
  size: string;
  url: string;
}

interface Link {
  id: string;
  url: string;
  name: string;
}

interface Brief {
  description: string;
  documents: Document[];
  links: Link[];
}

interface GeneralInfo {
  projectName: string;
}

export type ResourceType = "hourly" | "quantity" | "fixed";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  rate: number; // hourly rate or fixed cost
}

export interface Activity {
  id: string;
  name: string;
  resourceAllocations: { [resourceId: string]: number }; // hours or quantity
}

interface BudgetSection {
  id: string;
  name: string;
  amount?: number;
  activities: Activity[];
  resources: Resource[];
}

export interface Budget {
  section: BudgetSection[];
  commercial_margin: number;
  margin_type: "fixed" | "percentage";
  discount: number;
  discount_type: "fixed" | "percentage";
}

export interface SupabaseBudgetData {
  brief: Brief;
  general_info: GeneralInfo;
  budget: Budget;
  budget_type: string;
}

const defaultData: SupabaseBudgetData = {
  brief: { description: "", documents: [], links: [] },
  general_info: {
    projectName: "Untitled Budgez",
  },
  budget: {
    section: [],
    commercial_margin: 0,
    margin_type: "fixed",
    discount: 0,
    discount_type: "fixed",
  },
  budget_type: "tech",
};

export default function BudgetPage() {
  const router = useRouter();
  const params = useParams();
  const budgetId = params.id as string;
  const supabase = createClientComponentClient();
  const [budgetData, setBudgetData] = useState<SupabaseBudgetData>(defaultData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState("Untitled Budget");
  const [calculatorType, setCalculatorType] = useState("tech");
  const [isLoading, setIsLoading] = useState(true);
  const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false);
  const [pendingCalculatorType, setPendingCalculatorType] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateData, setTemplateData] = useState({name: '', tag: [] as string[], description: ''});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (budgetId) {
      loadBudget();
      console.log("loading the budget: ", budgetId);
    }
  }, [budgetId]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  const debouncedSave = useCallback(
    debounce(async (newTitle: string) => {
      try {
        const budgetBody = {
          ...budgetData,
        };

        const { error } = await supabase
          .from("budgets")
          .update({
            budget_name: newTitle,
            body: budgetBody,
            updated_at: new Date().toISOString(),
          })
          .eq("id", budgetId);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving budget:", error);
      }
    }, 500),
    [budgetData, budgetId]
  );

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTemplateData(prev => ({
        ...prev,
        tag: [...prev.tag, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTemplateData(prev => ({
      ...prev,
      tag: prev.tag.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          body: {
            template: {
              name: templateData.name,
              tag: templateData.tag,
              description: templateData.description
            },
            budget: budgetData
          }
        });
  
      if (error) throw error;
      setShowTemplateDialog(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const loadBudget = async () => {
    setIsLoading(true);
    try {
      const { data: budget, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", budgetId)
        .single();

      if (error) throw error;

      if (budget) {
        setTitle(budget.budget_name || "Untitled Budget");
        if (budget.body) {
          setBudgetData(budget.body as SupabaseBudgetData);
          setCalculatorType(budget.body.budget_type || "tech");
        }
      }
    } catch (error) {
      console.error("Error loading budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBudget = async (newBody: Partial<SupabaseBudgetData>) => {
    try {
      const budgetBody = {
        ...budgetData,
        ...newBody,
      };

      const { error } = await supabase
        .from("budgets")
        .update({
          budget_name: title,
          body: budgetBody,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budgetId);

      if (error) throw error;

      // Update local state after successful save
      setBudgetData(budgetBody);
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const confirmCalculatorTypeChange = async () => {
    if (pendingCalculatorType) {
      setCalculatorType(pendingCalculatorType);
      saveBudget({ budget_type: pendingCalculatorType });
      setShowTypeChangeDialog(false);
    }
  };

  const handleUpdate = (newData: Partial<SupabaseBudgetData>) => {
    const updatedData = { ...budgetData, ...newData };
    setBudgetData(updatedData);
    saveBudget(updatedData);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle);
  };

  const handleCalculatorTypeChange = (value: string) => {
    setPendingCalculatorType(value);
    setShowTypeChangeDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      <main className="flex-1 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              className="hover:bg-black rounded-sm hover:text-white"
              onClick={handleBack}
            >
              <ArrowLeft className="h-7 w-7" />
            </Button>
            <Input
              value={title}
              onChange={handleTitleChange}
              className="text-xl font-bold bg-white border-none focus:bg-white"
            />
            <div className="flex gap-1 ml-auto">
                <ShareDialog />
            </div>
          </div>

          <Tabs defaultValue="budget" className="mb-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="brief" className="data-[state=active]:bg-black data-[state=active]:text-white">📣Brief</TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-black data-[state=active]:text-white">🪖Budget</TabsTrigger>
              <TabsTrigger value="external" className="data-[state=active]:bg-black data-[state=active]:text-white">💎External</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-black data-[state=active]:text-white">📐Stats</TabsTrigger>

            </TabsList>
            
              
              <Button 
                variant="outline" 
                onClick={() => setShowTemplateDialog(true)}
                className="ml-4 mb-1 text-sm p-2"
              >
                💾 salva Template
              </Button>
            </div>

            <Card className="p-6">
              <TabsContent value="brief">
              <h2 className="text-xl font-bold mb-4">📣Brief</h2>
                <Brief id={budgetId} />
              </TabsContent>

              <TabsContent value="budget">
                <div className="flex justify-between items-center space-x-4 mb-6">
                  <h2 className="text-xl font-bold">🪖Budget</h2>
                  <Select
                    value={calculatorType}
                    onValueChange={handleCalculatorTypeChange}
                  >
                    <SelectTrigger className="w-[200px] font-bold">
                      <SelectValue placeholder="Select calculator type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">🪃Simple Budget</SelectItem>
                      <SelectItem value="tech">⛏️Project Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {calculatorType === "simple" && <SimpleBudget />}
                {calculatorType === "tech" && (
                  <TechBudget
                    onUpdate={(data) => handleUpdate({ budget: data })}
                    initialData={budgetData.budget}
                  />
                )}
              </TabsContent>

              <TabsContent value="external">
                <div className="flex justify-between">
                  <div className="flex gap-2 justify-center">
              <h2 className="text-xl font-bold mb-4">💎External</h2>
              <Button className="rounded-full p-2 bg-transparent h-8 w-8 hover:bg-gray-100 ">
              <GraduationCap className="h-8 w-8 text-gray-700" />
              </Button>
              </div>
              <div className="flex gap-1">
              <Button variant="outline" className="flex items-center bg-black hover:bg-gray-700 text-white hover:text-white">
              📢Pubblica
              </Button>
              <Button variant="outline" className="flex items-center">
              🥸Vedi
              </Button>
              </div>
              </div>
              <External />
              </TabsContent>

              <TabsContent value="stats">
                <h2 className="text-xl font-bold">📐Stats</h2>
                <div className="grid gap-4">
                <BudgetLogs budgetId={budgetId} />
                {/* Qui potrai aggiungere il futuro componente delle statistiche */}
              </div>
              </TabsContent>
            </Card>
          </Tabs>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(false)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialogo per verifica cambio select */}
      <Dialog
        open={showTypeChangeDialog}
        onOpenChange={setShowTypeChangeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vuoi davvero ambiare tipo di budget?</DialogTitle>
            <DialogDescription>
              Se hai dei dati salvati li perderai.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTypeChangeDialog(false)}
            >
              Annulla
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-400"
              onClick={confirmCalculatorTypeChange}
            >
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog to handle save templates */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salva Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input 
              value={templateData.name}
              onChange={(e) => setTemplateData(prev => ({...prev, name: e.target.value}))}
            />
          </div>
          <div>
            <Label>Tag</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {templateData.tag.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-gray-200 text-gray-800">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1">×</button>
                </Badge>
              ))}
            </div>
            <Input 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Premi Enter per aggiungere un tag"
            />
          </div>
          <div>
            <Label>Descrizione</Label>
            <Textarea 
              value={templateData.description}
              onChange={(e) => setTemplateData(prev => ({...prev, description: e.target.value}))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveTemplate}>
            Salva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </div>
  );
}
