//page.tsx - Pagina di creazione e modifica del budget
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft} from "lucide-react";
import { Button } from "@/components/ui/button";
import BudgetLogs from './components/stats/logs'
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Brief from "./components/brief";
import TechBudget from "./components/budget/compute_budget_section";
import debounce from "lodash/debounce";
import ShareDialog from './components/share';
import {InfoDialog, INFO_CONTENT} from '@/components/infodialogs/InfoDialogs'

type UserRole = 'owner' | 'editor' | 'viewer';


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
  rate: number; 
}

export interface Activity {
  id: string;
  name: string;
  resourceAllocations: { [resourceId: string]: number }; 
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

interface BudgetComplete {
  id: string;
  budget_name: string;
  public_id: string;
  body: SupabaseBudgetData;
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
  const [budgetData, setBudgetData] = useState<SupabaseBudgetData>(defaultData);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState("Untitled Budget");
  const [calculatorType, setCalculatorType] = useState("tech");
  const [isLoading, setIsLoading] = useState(true);
  const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false);
  const [pendingCalculatorType, setPendingCalculatorType] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetComplete | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  const loadBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: budget, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", budgetId)
        .single();
  
      if (error) throw error;
  
      if (budget) {
        setBudget(budget);
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
  }, [budgetId]);

  useEffect(() => {
    let isMounted = true; 
  
    const verifyPermissions = async () => {
      if (!budgetId) return;
      
      try {
        if (isMounted) setIsCheckingPermissions(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id || !isMounted) return;
  
        const { data: userLink, error: linkError } = await supabase
          .from('link_budget_users')
          .select('user_role')
          .eq('budget_id', budgetId)
          .eq('user_id', user.id)
          .single();
  
        if (!isMounted) return;
  
        if (linkError || !userLink) {
          router.push("/budgets");
          return;
        }
  
        const role = userLink.user_role as UserRole;
        if (!['owner', 'editor', 'viewer'].includes(role)) {
          router.push("/budgets");
          return;
        }
        await loadBudget();
        
      } catch (error) {
        console.error('Auth check failed:', error);
        if (isMounted) router.push("/budgets");
      } finally {
        if (isMounted) setIsCheckingPermissions(false);
      }
    };
  
    verifyPermissions();
  
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [budgetId, router, loadBudget]); 


  

    const handleBack = () => {
    router.push("/budgets");
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

 

  

  const saveBudget = async (newBody: SupabaseBudgetData) => {
    try {
      console.log('🔄 saveBudget - Starting save operation');
      console.log('📥 saveBudget - Received newBody:', newBody);

      // Prima otteniamo il budget corrente 
      const { data: currentBudget, error: fetchError } = await supabase
        .from("budgets")
        .select("body")
        .eq("id", budgetId)
        .single();
  
      if (fetchError) {
        console.error('❌ saveBudget - Error fetching current budget:', fetchError);
        throw fetchError;
      }

      console.log('📦 saveBudget - Current budget from DB:', currentBudget);

      // Se non esiste body o blocks, creiamo la struttura base
      const currentBlocks = currentBudget?.body?.blocks || [];
      console.log('🔍 saveBudget - Current blocks:', currentBlocks);
      
      // Cerchiamo il blocco techbudget
      let techBudgetIndex = currentBlocks.findIndex((block: {type: string}) => block.type === "techbudget");
      console.log('🔍 saveBudget - techBudget block index:', techBudgetIndex);
  
      // Se non esiste il blocco techbudget, lo creiamo

      if (techBudgetIndex === -1) {
        console.log('➕ saveBudget - Creating new techbudget block');
        currentBlocks.push({
          id: Math.random().toString(36).substr(2, 9),
          type: "techbudget",
          content: {}
        });
        techBudgetIndex = currentBlocks.length - 1;
      }
  
      // Aggiorniamo il content del blocco techbudget
      const newContent = {
        section: newBody.budget?.section || [],
        commercial_margin: newBody.budget?.commercial_margin || 0,
        margin_type: newBody.budget?.margin_type || "fixed",
        discount: newBody.budget?.discount || 0,
        discount_type: newBody.budget?.discount_type || "fixed"
      };
      
      console.log('📝 saveBudget - New content for techbudget block:', newContent);
      currentBlocks[techBudgetIndex].content = newContent;
  
      // Creiamo l'oggetto body aggiornato
      const updatedBody = {
        ...currentBudget?.body,
        blocks: currentBlocks,
        budget_type: newBody.budget_type
      };
  
      console.log('📤 saveBudget - Final updated body to save:', updatedBody);
  
      // Salviamo il body aggiornato
      const { error: updateError } = await supabase
        .from("budgets")
        .update({
          body: updatedBody,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budgetId);
  
      if (updateError) {
        console.error('❌ saveBudget - Error updating budget:', updateError);
        throw updateError;
      }
  
      //console.log('✅ saveBudget - Successfully saved budget');
      
      //console.log('🔄 saveBudget - Reloading budget');
      await loadBudget();
      //console.log('✅ saveBudget - Budget reloaded');

    } catch (error) {
      console.error("❌ saveBudget - Error in save operation:", error);
      throw error;
    }
  };
  

  const confirmCalculatorTypeChange = async () => {
    if (pendingCalculatorType) {
      setCalculatorType(pendingCalculatorType);
      saveBudget({ 
        ...budgetData,  
        budget_type: pendingCalculatorType 
      });
      setShowTypeChangeDialog(false);
    }
  };

  
  
  const handleUpdate = async (newData: SupabaseBudgetData) => {
    try {
      // Aggiorna lo stato locale immediatamente
      setBudgetData(newData);
      
      // Salva nel database
      await saveBudget(newData);
      
      // Optional: aggiungi un feedback di successo
      // console.log('Budget saved successfully');
    } catch (error) {
      console.error("Failed to save budget:", error);
      // Rollback dello stato in caso di errore
      setBudgetData(prevData => prevData);
    }
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

  if (isCheckingPermissions || isLoading) {
    // console.log(isCheckingPermissions ? "Verifying permissions..." : "Loading...")
    return (
      <div className="flex h-full items-center justify-center">
        {isCheckingPermissions ? "Verifying permissions..." : "Loading..."}
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-100">
      <main className="flex-1 p-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              className="hover:bg-black rounded-sm hover:text-white"
              onClick={handleBack}
            >
              <ArrowLeft className="h-7 w-7" />
            </Button>
            <div className="flex-1 flex items-center gap-2 bg-white rounded-md px-3 py-2 whitespace-nowrap">
              <Input
                value={title}
                onChange={handleTitleChange}
                className="text-xl font-bold bg-transparent border-none focus:bg-transparent p-0 min-w-0 h-fit"
              />
              {budget?.public_id && (
                <span className="text-sm text-gray-400 rounded-md flex-shrink-0">
                  id: {budget.public_id}
                </span>
              )}
            </div>

            <div className="flex gap-1 ml-auto">
                <ShareDialog budgetId={budgetId} />
            </div>
          </div>

          <Tabs defaultValue="brief" className="mb-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="brief" className="data-[state=active]:bg-black data-[state=active]:text-white">📄Brief</TabsTrigger>
              {/* <TabsTrigger value="budget" className="data-[state=active]:bg-black data-[state=active]:text-white">🧮Calcola</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-black data-[state=active]:text-white">📐Stats</TabsTrigger> */}

            </TabsList>
            
              
             
            </div>
            {/* bg-transparent shadow-none border-0 */}
            <Card className="p-2 ">

              {/* Working on it tab */}
              <TabsContent value="brief">
                <div className="flex justify-between items-center mb-1 pb-2">

                <div className="flex gap-2 justify-center items-center">
                  
                  <h2 className="text-xl font-bold">📄Brief</h2>
                  <InfoDialog {...INFO_CONTENT.brief} />
                </div>
              </div>
                <Brief id={budgetId} />
              </TabsContent>



                    {/* Calcola tab - to be deleted */}
              <TabsContent value="budget">
                <div className="flex justify-between items-center space-x-4 mb-6">
                  <h2 className="text-xl font-bold">🧮Calcola</h2>
                  <Select
                    value={calculatorType}
                    onValueChange={handleCalculatorTypeChange}
                  >
                    <SelectTrigger className="w-[200px] font-bold">
                      <SelectValue placeholder="Select calculator type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectItem value="simple">🪃Simple Budget</SelectItem> */}
                      <SelectItem value="tech">⛏️Project Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {calculatorType === "tech" && (
                  <TechBudget
                    onUpdate={(data) => {
                      const budgetData = {
                        section: data.section,
                        commercial_margin: data.commercial_margin,
                        margin_type: data.margin_type,
                        discount: data.discount,
                        discount_type: data.discount_type
                      };
                      
                      handleUpdate({
                        budget: budgetData,
                        budget_type: "tech"
                      } as SupabaseBudgetData);
                    }}
                    initialData={budgetData.budget}
                  />
                )}
              </TabsContent>



              <TabsContent value="stats">
               
                <div className="flex justify-between items-center mb-1">
                <div className="flex gap-2 justify-center items-center">
                  
                  <h2 className="text-xl font-bold">📐Stats </h2>
                  <InfoDialog {...INFO_CONTENT.stats} />
              
              
              </div>
                
                 </div>
                <div className="grid gap-4">
                <BudgetLogs budgetId={budgetId} />
                
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

      
    {/* dialog settings external tab */}
    

    </div>
  );
}
