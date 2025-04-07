import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Gauge,
  SwatchBook,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  LayoutPanelTop,
  ArrowUp,
  ArrowDown,
  Calendar,
  AlignLeft
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  Activity,
  Budget,
  Resource,
  ResourceType,
  SupabaseBudgetData,
} from "../../../page";

// Import template component
import TemplateSelector from "./components/budgetTemplatedialog";
// Import description dialog
import DescriptionDialog from "./components/DescriptionDialog";

// Types

// Add these with your other interfaces
interface TemplateItem {
  id: string;
  name: string;
  body: unknown;
}

interface SectionTemplateBody {
  name: string;
  resources?: {
    id: string;
    name: string;
    type?: ResourceType;
    rate?: number;
  }[];
  activities?: {
    id: string;
    name: string;
    resourceAllocations?: {
      [key: string]: number;
    };
  }[];
}

interface ResourceTemplateBody {
  name: string;
  type?: ResourceType;
  rate?: number;
}

interface ActivityWithDates extends Activity {
  startDate?: string; // formato "YYYY-MM-DD"
  endDate?: string; // formato "YYYY-MM-DD"
  description?: string; // Added description field
}

interface TBBudgetSection {
  id: string;
  name: string;
  isExpanded: boolean;
  isResourcesExpanded: boolean; 
  activities: ActivityWithDates[];
  resources: Resource[];
  enabled: boolean;
  // Date calcolate in base alle attività
  startDate?: string;
  endDate?: string;
  description?: string; // Added description field
}


interface RawSection {
  id: string;
  name: string;
  activities?: Activity[];
  resources?: Resource[];
  description?: string; // Added description field
}

interface TBBudgetData {
  section: TBBudgetSection[];
  commercialMargin: number;
  marginType: "fixed" | "percentage";
  discount: number;
  discountType: "fixed" | "percentage";
}

interface Props {
  content?: string;
  onChange?: (content: string) => void;
  onUpdate?: (data: Budget) => void;
  initialData?: {
    section?: SupabaseBudgetData["budget"]["section"];
    commercial_margin?: number;
    margin_type?: "fixed" | "percentage";
    discount?: number;
    discount_type?: "fixed" | "percentage";
  };
}

// Constants
const DEFAULT_BUDGET: TBBudgetData = {
  section: [
    {
      id: uuidv4(),
      name: "New Section",
      isExpanded: false,
      isResourcesExpanded: false,
      activities: [],
      resources: [],
      enabled: true,
      description: ""
    },
  ],
  commercialMargin: 0,
  marginType: "fixed",
  discount: 0,
  discountType: "fixed",
};

const CURRENCY_FORMAT_OPTIONS = {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
} as const;

// Reusable Components
interface NumericInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({ suffix = '€', ...props }) => (
  <Input
    type="number"
    {...props}
    className={`[&::-webkit-inner-spin-button]:appearance-none relative pr-6 font-semibold ${props.className || ''}`}
    style={{
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='16px' width='16px'><text x='1' y='12' fill='gray'>${suffix}</text></svg>")`,
      backgroundPosition: 'right 8px center',
      backgroundRepeat: 'no-repeat',
      ...props.style
    }}
  />
);

interface ValueTypeRadioGroupProps {
  value: "fixed" | "percentage";
  onChange: (value: "fixed" | "percentage") => void;
  name: string;
}

const ValueTypeRadioGroup: React.FC<ValueTypeRadioGroupProps> = ({
  value,
  onChange,
  name
}) => (
  <RadioGroup
    value={value}
    onValueChange={onChange}
    className="flex items-center space-x-4 mb-2"
  >
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="fixed" id={`${name}-fixed`} />
      <Label htmlFor={`${name}-fixed`}>Fixed (€)</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="percentage" id={`${name}-percentage`} />
      <Label htmlFor={`${name}-percentage`}>Percentage (%)</Label>
    </div>
  </RadioGroup>
);

// Helper Functions
const formatCurrency = (value: number): string => {
  return value.toLocaleString("en-US", CURRENCY_FORMAT_OPTIONS);
};

// Calcola le date di inizio e fine di una sezione basate sulle date delle attività
const calculateSectionDates = (activities: ActivityWithDates[]): { startDate?: string; endDate?: string } => {
  // Filtra le attività con date valide
  const activitiesWithDates = activities.filter(
    activity => activity.startDate || activity.endDate
  );
  
  if (activitiesWithDates.length === 0) {
    return { startDate: undefined, endDate: undefined };
  }
  
  // Trova la data di inizio più antica e la data di fine più recente
  const startDates = activitiesWithDates
    .filter(a => a.startDate)
    .map(a => a.startDate as string);
  
  const endDates = activitiesWithDates
    .filter(a => a.endDate)
    .map(a => a.endDate as string);
  
  const startDate = startDates.length > 0 ? startDates.sort()[0] : undefined;
  const endDate = endDates.length > 0 ? endDates.sort().reverse()[0] : undefined;
  
  return { startDate, endDate };
};

// Aggiorna le date di una sezione in base alle date delle attività
const updateSectionWithDates = (section: TBBudgetSection): TBBudgetSection => {
  const { startDate, endDate } = calculateSectionDates(section.activities);
  return { ...section, startDate, endDate };
};

const updateSectionById = (
  sections: TBBudgetSection[], 
  sectionId: string, 
  updater: (section: TBBudgetSection) => TBBudgetSection
): TBBudgetSection[] => {
  return sections.map(section => 
    section.id === sectionId ? updater(section) : section
  );
};

const deleteItem = <T extends { id: string }>(
  items: T[],
  itemId: string
): T[] => items.filter(item => item.id !== itemId);

// Funzione per calcolare il periodo totale del progetto
const calculateProjectTimeline = (sections: TBBudgetSection[]): { startDate?: string; endDate?: string } => {
  // Filtra le sezioni con date valide e che sono abilitate
  const sectionsWithDates = sections.filter(
    section => section.enabled && (section.startDate || section.endDate)
  );
  
  if (sectionsWithDates.length === 0) {
    return { startDate: undefined, endDate: undefined };
  }
  
  // Trova la data di inizio più antica e la data di fine più recente
  const startDates = sectionsWithDates
    .filter(s => s.startDate)
    .map(s => s.startDate as string);
  
  const endDates = sectionsWithDates
    .filter(s => s.endDate)
    .map(s => s.endDate as string);
  
  const startDate = startDates.length > 0 ? startDates.sort()[0] : undefined;
  const endDate = endDates.length > 0 ? endDates.sort().reverse()[0] : undefined;
  
  return { startDate, endDate };
};

// Componente Timeline
const Timeline: React.FC<{ sections: TBBudgetSection[] }> = ({ sections }) => {
  const { startDate, endDate } = calculateProjectTimeline(sections);
  
  if (!startDate || !endDate) {
    return null;
  }
  
  // Calcola la durata totale in giorni
  const projectStart = new Date(startDate);
  const projectEnd = new Date(endDate);
  const projectDurationDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Filtra solo le sezioni abilitate con date valide
  const activeTimelineSections = sections.filter(
    section => section.enabled && section.startDate && section.endDate
  );
  
  if (activeTimelineSections.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg border p-3 mb-4">
      <h3 className="text-sm font-semibold flex items-center gap-1 mb-3 text-gray-700">
        <Calendar className="h-3.5 w-3.5 opacity-70" />
        Timeline del Progetto ({projectStart.toLocaleDateString()} - {projectEnd.toLocaleDateString()})
      </h3>
      
      <div className="mb-1 text-xs text-gray-500 flex justify-between">
        <span>{projectStart.toLocaleDateString()}</span>
        <span>{projectEnd.toLocaleDateString()}</span>
      </div>
      
      <div className="space-y-2">
        {activeTimelineSections.map((section) => {
          const sectionStart = new Date(section.startDate as string);
          const sectionEnd = new Date(section.endDate as string);
          
          // Calcola posizione e larghezza in percentuale
          const startOffset = Math.max(
            0,
            ((sectionStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / projectDurationDays
          );
          
          const endOffset = Math.min(
            1,
            ((sectionEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24) + 1) / projectDurationDays
          );
          
          const width = (endOffset - startOffset) * 100;
          const left = startOffset * 100;
          
          // Genera un colore basato sull'ID della sezione
          const hue = (parseInt(section.id.substring(0, 3), 16) % 360);
          const color = `hsl(${hue}deg, 70%, 50%)`;
          
          return (
            <div key={section.id} className="flex items-center gap-2">
              <div className="w-1/4 text-sm font-medium truncate" title={section.name}>
                {section.name}
              </div>
              <div className="relative flex-1 h-6 bg-gray-100 rounded-md">
                <div 
                  className="absolute h-full rounded-md flex items-center px-2 justify-center overflow-hidden text-xs text-white font-medium"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                  title={`${sectionStart.toLocaleDateString()} - ${sectionEnd.toLocaleDateString()}`}
                >
                  {width > 10 && (
                    <span className="truncate">
                      {sectionStart.toLocaleDateString()} - {sectionEnd.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente per visualizzare la timeline delle attività di una sezione
const SectionActivitiesTimeline: React.FC<{ 
  section: TBBudgetSection,
  projectStart: Date,
  projectEnd: Date,
  projectDurationDays: number
}> = ({ section, projectStart, projectDurationDays }) => {
  // Filtra solo le attività con date valide
  const activitiesWithDates = section.activities.filter(
    activity => activity.startDate && activity.endDate
  );
  
  if (activitiesWithDates.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-3 border rounded-md p-2 bg-gray-50">
      <h4 className="text-xs font-medium mb-2 text-gray-700 flex items-center gap-1">
        <Calendar className="h-3 w-3" /> 
        Timeline Attività
      </h4>
      
      <div className="space-y-1.5">
        {activitiesWithDates.map((activity) => {
          const activityStart = new Date(activity.startDate as string);
          const activityEnd = new Date(activity.endDate as string);
          
          // Calcola posizione e larghezza in percentuale
          const startOffset = Math.max(
            0,
            ((activityStart.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) / projectDurationDays
          );
          
          const endOffset = Math.min(
            1,
            ((activityEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24) + 1) / projectDurationDays
          );
          
          const width = (endOffset - startOffset) * 100;
          const left = startOffset * 100;
          
          return (
            <div key={activity.id} className="flex items-center gap-2">
              <div className="w-1/4 text-xs truncate" title={activity.name}>
                {activity.name}
              </div>
              <div className="relative flex-1 h-5 bg-white rounded border">
                <div 
                  className="absolute h-full rounded-sm flex items-center px-1 justify-center overflow-hidden text-[0.65rem] text-white"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                  }}
                  title={`${activityStart.toLocaleDateString()} - ${activityEnd.toLocaleDateString()}`}
                >
                  {width > 15 && (
                    <span className="truncate">
                      {activityStart.toLocaleDateString()} - {activityEnd.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Component
const TechBudgetScreen: React.FC<Props> = ({ content, onChange, onUpdate = () => {}, initialData }) => {
  const [budget, setBudget] = React.useState<TBBudgetData>(() => {
    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        return {
          section: parsedContent.section.map((s: RawSection) => ({
            ...s,
            isExpanded: false,
            isResourcesExpanded: false,
            activities: s.activities || [],
            resources: s.resources || [],
            enabled: true,
          })),
          commercialMargin: parsedContent.commercial_margin || 0,
          marginType: parsedContent.margin_type || "fixed",
          discount: parsedContent.discount || 0,
          discountType: parsedContent.discount_type || "fixed",
        } as TBBudgetData;
      } catch (e) {
        console.error(e)
        return DEFAULT_BUDGET;
      }
    }
    if (!initialData) return DEFAULT_BUDGET;
    return {
      section: initialData.section
        ? initialData.section.map((s) => ({
            ...s,
            isExpanded: false,
            isResourcesExpanded: false,
            activities: s.activities || [],
            resources: s.resources || [],
            enabled: true,
          }))
        : DEFAULT_BUDGET.section,
      commercialMargin: initialData.commercial_margin || 0,
      marginType: initialData.margin_type || "fixed",
      discount: initialData.discount || 0,
      discountType: initialData.discount_type || "fixed",
    } as TBBudgetData;
  });

  // State for template dialogs
  const [sectionTemplateDialogOpen, setSectionTemplateDialogOpen] = useState(false);
  const [resourceTemplateDialogOpen, setResourceTemplateDialogOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  // State for description dialogs
  const [sectionDescriptionDialogOpen, setSectionDescriptionDialogOpen] = useState(false);
  const [activityDescriptionDialogOpen, setActivityDescriptionDialogOpen] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);
  const [currentEditingItem, setCurrentEditingItem] = useState<{name: string, description: string}>({
    name: '',
    description: ''
  });

  const calculateActivityCost = (
    activity: Activity,
    resources: Resource[]
  ): number => {
    return resources.reduce((total, resource) => {
      const allocation = activity.resourceAllocations[resource.id] || 0;
      if (resource.type === "fixed") {
        return total + allocation;
      }
      return total + allocation * resource.rate;
    }, 0);
  };

  const calculateSectionTotal = (section: TBBudgetSection): number => {
    // Return 0 if the section is disabled
    if (!section.enabled) return 0;
    
    return section.activities.reduce(
      (total, activity) => total + calculateActivityCost(activity, section.resources),
      0
    );
  };

  const calculateResourceTypeTotals = () => {
    let hourlyHours = 0;
    let hourlyTotal = 0;
    let quantityAmount = 0;
    let quantityTotal = 0;
    let fixedTotal = 0;

    budget.section.forEach(section => {
      // Skip disabled sections
      if (!section.enabled) return;
      
      section.activities.forEach(activity => {
        section.resources.forEach(resource => {
          const allocation = activity.resourceAllocations[resource.id] || 0;
          if (resource.type === "hourly") {
            hourlyHours += allocation;
            hourlyTotal += allocation * resource.rate;
          } else if (resource.type === "quantity") {
            quantityAmount += allocation;
            quantityTotal += allocation * resource.rate;
          } else if (resource.type === "fixed") {
            fixedTotal += allocation;
          }
        });
      });
    });

    return {
      hourlyHours,
      hourlyTotal,
      quantityAmount,
      quantityTotal,
      fixedTotal,
    };
  };


  const calculateTotal = (): {
    baseTotal: number;
    totalWithMargin: number;
    marginAmount: number;
    discountAmount: number;
    finalTotal: number;
  } => {
    const baseTotal = budget.section.reduce(
      (sum, section) => sum + calculateSectionTotal(section),
      0
    );

    const marginAmount =
      budget.marginType === "fixed"
        ? budget.commercialMargin
        : baseTotal * (budget.commercialMargin / 100);

    const totalWithMargin = baseTotal + marginAmount;

    const discountAmount =
      budget.discountType === "fixed"
        ? budget.discount
        : totalWithMargin * (budget.discount / 100);

    const finalTotal = totalWithMargin - discountAmount;

    return {
      baseTotal,
      totalWithMargin,
      marginAmount,
      discountAmount,
      finalTotal,
    };
  };

  // Template handling functions
  const processSelectedSectionTemplate = (templateBody: SectionTemplateBody): TBBudgetSection => {
    // Create new IDs mapping for resources
    const resourceIdMapping: { [key: string]: string } = {};
    const processedResources = (templateBody.resources || []).map(resource => {
      const newId = uuidv4();
      resourceIdMapping[resource.id] = newId;
      return {
        ...resource,
        id: newId,
        // Ensure type is always defined by providing a default
        type: resource.type || "hourly", // Default to "hourly" if type is undefined
        // Ensure rate is always defined for non-fixed resources
        rate: (resource.type !== "fixed" && resource.rate !== undefined) ? resource.rate : 0
      };
    });

    // Process activities with new resource IDs
    const processedActivities = (templateBody.activities || []).map(activity => {
      const newAllocations: { [key: string]: number } = {};
      
      // Update resource IDs in allocations
      Object.entries(activity.resourceAllocations || {}).forEach(([oldResourceId, allocation]) => {
        const newResourceId = resourceIdMapping[oldResourceId];
        if (newResourceId) {
          newAllocations[newResourceId] = allocation;
        }
      });

      return {
        ...activity,
        id: uuidv4(),
        resourceAllocations: newAllocations,
      };
    });

    // Return the processed section
    return {
      id: uuidv4(),
      name: templateBody.name,
      isExpanded: true,
      isResourcesExpanded: true,
      resources: processedResources,
      activities: processedActivities,
      enabled: true,
    };
  };

  const processSelectedResourceTemplate = (templateBody: ResourceTemplateBody): Resource => {
    return {
      id: uuidv4(),
      name: templateBody.name,
      type: templateBody.type || "hourly",
      rate: templateBody.rate || 0,
    };
  };

  const handleOpenSectionTemplateDialog = () => {
    setSectionTemplateDialogOpen(true);
  };

  const handleOpenResourceTemplateDialog = (sectionId:string) => {
    setCurrentSectionId(sectionId);
    setResourceTemplateDialogOpen(true);
  };

  const handleSelectSectionTemplates = (selectedTemplates: TemplateItem[]) => {
    const newSections = [...budget.section];
    
    selectedTemplates.forEach(item => {
      const processedSection = processSelectedSectionTemplate(item.body as SectionTemplateBody);
      newSections.push(processedSection);
    });
    
    updateBudget({ section: newSections });
  };

  const handleSelectResourceTemplates = (selectedTemplates: TemplateItem[]) => {
    if (!currentSectionId) return;
    
    const section = budget.section.find(s => s.id === currentSectionId);
    if (!section) return;
    
    const newResources = [...section.resources];
    
    selectedTemplates.forEach(item => {
      const processedResource = processSelectedResourceTemplate(item.body as ResourceTemplateBody);
      newResources.push(processedResource);
    });
    
    const newSections = updateSectionById(
      budget.section,
      currentSectionId,
      s => ({ ...s, resources: newResources })
    );
    
    updateBudget({ section: newSections });
  };

  const toggleSection = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      isExpanded: !section.isExpanded
    }));
    updateBudget({ section: newSections });
  };

  const toggleResources = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      isResourcesExpanded: !section.isResourcesExpanded
    }));
    updateBudget({ section: newSections });
  };

  const moveSectionUp = (sectionId: string) => {
    const sectionIndex = budget.section.findIndex(s => s.id === sectionId);
    if (sectionIndex <= 0) return; // Cannot move up if it's the first section
    
    const newSections = [...budget.section];
    // Swap with the section above
    [newSections[sectionIndex - 1], newSections[sectionIndex]] = 
      [newSections[sectionIndex], newSections[sectionIndex - 1]];
    
    updateBudget({ section: newSections });
  };
  
  const moveSectionDown = (sectionId: string) => {
    const sectionIndex = budget.section.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1 || sectionIndex >= budget.section.length - 1) return; // Cannot move down if it's the last section
    
    const newSections = [...budget.section];
    // Swap with the section below
    [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
      [newSections[sectionIndex + 1], newSections[sectionIndex]];
    
    updateBudget({ section: newSections });
  };
  
  const toggleSectionEnabled = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      enabled: !section.enabled
    }));
    updateBudget({ section: newSections });
  };

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = budget.section.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;
  
    // Create new IDs mapping for resources
    const resourceIdMapping: { [key: string]: string } = {};
    const duplicatedResources = sectionToDuplicate.resources.map(resource => {
      const newId = uuidv4();
      resourceIdMapping[resource.id] = newId;
      return {
        ...resource,
        id: newId,
      };
    });
  
    // Duplicate activities with updated resource allocations
    const duplicatedActivities = sectionToDuplicate.activities.map(activity => {
      const newAllocations: { [key: string]: number } = {};
      
      // Update resource IDs in allocations
      Object.entries(activity.resourceAllocations).forEach(([oldResourceId, allocation]) => {
        const newResourceId = resourceIdMapping[oldResourceId];
        if (newResourceId) {
          newAllocations[newResourceId] = allocation;
        }
      });
  
      return {
        ...activity,
        id: uuidv4(),
        resourceAllocations: newAllocations,
        // Keep description when duplicating
        description: activity.description
      };
    });
  
    // Create the duplicated section
    const duplicatedSection: TBBudgetSection = {
      ...sectionToDuplicate,
      id: uuidv4(),
      name: `${sectionToDuplicate.name} (Copy)`,
      isExpanded: false,
      isResourcesExpanded: false,
      resources: duplicatedResources,
      activities: duplicatedActivities,
      enabled: sectionToDuplicate.enabled,
      // Keep description when duplicating
      description: sectionToDuplicate.description
    };
  
    // Insert the duplicated section after the original
    const sectionIndex = budget.section.findIndex(s => s.id === sectionId);
    const newSections = [...budget.section];
    newSections.splice(sectionIndex + 1, 0, duplicatedSection);
  
    updateBudget({ section: newSections });
  };

  // Description dialog handlers
  const handleOpenSectionDescription = (sectionId: string) => {
    const section = budget.section.find(s => s.id === sectionId);
    if (!section) return;

    setCurrentSectionId(sectionId);
    setCurrentEditingItem({
      name: section.name,
      description: section.description || ''
    });
    setSectionDescriptionDialogOpen(true);
  };

  const handleOpenActivityDescription = (sectionId: string, activityId: string) => {
    const section = budget.section.find(s => s.id === sectionId);
    if (!section) return;

    const activity = section.activities.find(a => a.id === activityId);
    if (!activity) return;

    setCurrentSectionId(sectionId);
    setCurrentActivityId(activityId);
    setCurrentEditingItem({
      name: activity.name,
      description: activity.description || ''
    });
    setActivityDescriptionDialogOpen(true);
  };

  const handleSaveSectionDescription = (name: string, description: string) => {
    if (!currentSectionId) return;

    const newSections = updateSectionById(budget.section, currentSectionId, section => ({
      ...section,
      name,
      description
    }));
    updateBudget({ section: newSections });
  };

  const handleSaveActivityDescription = (name: string, description: string) => {
    if (!currentSectionId || !currentActivityId) return;

    const newSections = updateSectionById(budget.section, currentSectionId, section => ({
      ...section,
      activities: section.activities.map(activity => 
        activity.id === currentActivityId 
          ? { ...activity, name, description }
          : activity
      )
    }));
    updateBudget({ section: newSections });
  };

  const addSection = () => {
    updateBudget({
      section: [
        ...budget.section,
        {
          id: uuidv4(),
          name: "New Section",
          isExpanded: false,
          isResourcesExpanded: false,
          activities: [],
          resources: [],
          enabled: true,
          description: ""
        },
      ],
    });
  };

  const addActivity = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => {
      const newActivity = {
        id: uuidv4(),
        name: "New Activity",
        resourceAllocations: {},
        startDate: undefined,
        endDate: undefined,
        description: ""
      };
      
      const updatedSection = {
        ...section,
        activities: [...section.activities, newActivity],
      };
      
      return updateSectionWithDates(updatedSection);
    });
    
    updateBudget({ section: newSections });
  };

  const addResource = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      resources: [
        ...section.resources,
        {
          id: uuidv4(),
          name: "New Resource",
          type: "hourly",
          rate: 0,
        },
      ],
    }));
    updateBudget({ section: newSections });
  };

  const updateResource = (
    sectionId: string,
    resourceId: string,
    updates: Partial<Resource>
  ) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      resources: section.resources.map(resource =>
        resource.id === resourceId ? { ...resource, ...updates } : resource
      ),
    }));
    updateBudget({ section: newSections });
  };

  const updateActivity = (
    sectionId: string,
    activityId: string,
    updates: Partial<ActivityWithDates> | { resourceId: string; allocation: number }
  ) => {
    const newSections = updateSectionById(budget.section, sectionId, section => {
      const updatedActivities = section.activities.map(activity => {
        if (activity.id === activityId) {
          if ("resourceId" in updates) {
            return {
              ...activity,
              resourceAllocations: {
                ...activity.resourceAllocations,
                [updates.resourceId]: updates.allocation,
              },
            };
          }
          return { ...activity, ...updates };
        }
        return activity;
      });
      
      const updatedSection = {
        ...section,
        activities: updatedActivities,
      };
      
      // Ricalcola le date della sezione
      return updateSectionWithDates(updatedSection);
    });
    
    updateBudget({ section: newSections });
  };

  const deleteSection = (sectionId: string) => {
    updateBudget({
      section: deleteItem(budget.section, sectionId),
    });
  };

  const deleteActivity = (sectionId: string, activityId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      activities: deleteItem(section.activities, activityId),
    }));
    updateBudget({ section: newSections });
  };

  const deleteResource = (sectionId: string, resourceId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      resources: deleteItem(section.resources, resourceId),
      activities: section.activities.map(activity => ({
        ...activity,
        resourceAllocations: Object.fromEntries(
          Object.entries(activity.resourceAllocations).filter(
            ([key]) => key !== resourceId
          )
        ),
      })),
    }));
    updateBudget({ section: newSections });
  };

  const updateBudget = (newData: Partial<TBBudgetData>) => {
    const updated = { ...budget, ...newData };
    setBudget(updated);
    
    const dataForParent = {
      section: updated.section.map(section => ({
        id: section.id,
        name: section.name,
        activities: section.activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          resourceAllocations: activity.resourceAllocations,
          startDate: activity.startDate,
          endDate: activity.endDate,
          description: activity.description
        })),
        resources: section.resources,
        enabled: section.enabled,
        startDate: section.startDate,
        endDate: section.endDate,
        description: section.description
      })),
      commercial_margin: updated.commercialMargin,
      margin_type: updated.marginType,
      discount: updated.discount,
      discount_type: updated.discountType,
    };

    if (onChange) {
      onChange(JSON.stringify(dataForParent));
    }
    
    if (onUpdate) {
      onUpdate(dataForParent);
    }
  };

  return (
    <div className="space-y-4 p-2">
      {/* Template Dialogs */}
      <TemplateSelector
        isOpen={sectionTemplateDialogOpen}
        onClose={() => setSectionTemplateDialogOpen(false)}
        onSelectTemplates={handleSelectSectionTemplates}
        type="section"
      />
      
      <TemplateSelector
        isOpen={resourceTemplateDialogOpen}
        onClose={() => setResourceTemplateDialogOpen(false)}
        onSelectTemplates={handleSelectResourceTemplates}
        type="resource"
      />
      
      {/* Description Dialogs */}
      <DescriptionDialog
        isOpen={sectionDescriptionDialogOpen}
        onClose={() => setSectionDescriptionDialogOpen(false)}
        title={currentEditingItem.name}
        description={currentEditingItem.description}
        itemName={currentEditingItem.name}
        onSave={handleSaveSectionDescription}
        dialogTitle="Descrizione Sezione:"
      />
      
      <DescriptionDialog
        isOpen={activityDescriptionDialogOpen}
        onClose={() => setActivityDescriptionDialogOpen(false)}
        title={currentEditingItem.name}
        description={currentEditingItem.description}
        itemName={currentEditingItem.name}
        onSave={handleSaveActivityDescription}
        dialogTitle="Descrizione Attività:"
      />
      
      {/* Top Controls and Summary */}
      <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={addSection} className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1" />
            sezione
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenSectionTemplateDialog} className="h-8">
            <LayoutPanelTop className="h-3.5 w-3.5 mr-1" />
            Template
          </Button>
        </div>
        
        <div className="bg-gray-50 rounded-md p-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {(() => {
            const totals = calculateTotal();
            const resourceTotals = calculateResourceTypeTotals();
            return (
              <>
                <div className="flex flex-col">
                  <span className="text-gray-500">Ore</span>
                  <span className="font-medium">{resourceTotals.hourlyHours.toFixed(1)}h</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Risorse</span>
                  <span className="font-medium">{formatCurrency(resourceTotals.quantityTotal + resourceTotals.hourlyTotal)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500">Spese fisse</span>
                  <span className="font-medium">{formatCurrency(resourceTotals.fixedTotal)}</span>
                </div>
                <div className="flex flex-col border-l pl-4">
                  <span className="text-gray-500">Totale</span>
                  <span className="font-bold">{formatCurrency(totals.finalTotal)}</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Project Timeline - aggiunto qui */}
      <Timeline sections={budget.section} />

      {/* Sections */}
      <div className="space-y-2">
        {budget.section.map((section, index) => (
          <div 
            key={section.id} 
            className={`border overflow-hidden transition-colors duration-200 ${
              section.isExpanded 
                ? 'rounded-md border-blue-200 shadow-sm' 
                : 'rounded-full border-gray-200'
            } ${!section.enabled ? 'opacity-60' : ''}`}
          >
            <div 
              className={`flex items-center gap-2 p-2 transition-colors duration-200 ${
                section.isExpanded 
                  ? 'bg-blue-50/70' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } ${!section.enabled ? 'bg-gray-100' : ''}`}
            >
              <button
                onClick={() => toggleSection(section.id)}
                className={`p-1 rounded-full transition-transform duration-300 ${
                  section.isExpanded ? 'bg-blue-100 text-blue-700 rotate-90' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {section.isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <Input
                placeholder="Section name"
                value={section.name}
                onChange={(e) => {
                  const newSections = updateSectionById(
                    budget.section,
                    section.id,
                    s => ({ ...s, name: e.target.value })
                  );
                  updateBudget({ section: newSections });
                }}
                className={`flex-1 font-bold h-8 text-sm border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0 ${
                  section.isExpanded ? 'text-blue-800' : ''
                } ${!section.enabled ? 'text-gray-500' : ''}`}
              />
              <div className="flex flex-col items-end text-xs text-gray-500">
                {section.startDate && section.endDate && (
                  <>
                    <span>{new Date(section.startDate).toLocaleDateString()}</span>
                    <span>→ {new Date(section.endDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
              <div className="font-bold text-sm">
                {formatCurrency(calculateSectionTotal(section))}
              </div>
              <div className="flex gap-1">
                {/* Section Enable/Disable Toggle */}
                <div className="flex items-center" title={section.enabled ? "Disable section" : "Enable section"}>
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={() => toggleSectionEnabled(section.id)}
                    aria-label={`${section.enabled ? "Disable" : "Enable"} section`}
                  />
                </div>
                {/* Description Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenSectionDescription(section.id)}
                  title="Edit description"
                  className="h-7 w-7"
                >
                  <AlignLeft className={`h-3.5 w-3.5 ${section.description ? 'text-blue-600' : 'text-gray-400'}`} />
                </Button>
                {/* Move Up Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveSectionUp(section.id)}
                  disabled={index === 0}
                  title="Move section up"
                  className="h-7 w-7"
                >
                  <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                {/* Move Down Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveSectionDown(section.id)}
                  disabled={index === budget.section.length - 1}
                  title="Move section down"
                  className="h-7 w-7"
                >
                  <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => duplicateSection(section.id)}
                  title="Duplicate section"
                  className="h-7 w-7"
                >
                  <Copy className="h-3.5 w-3.5 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSection(section.id)}
                  className="h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-800" />
                </Button>
              </div>
            </div>

            {section.isExpanded && (
              <div className="p-2 space-y-3">
                {/* Resources and Activities in tabs */}
                <div className="border rounded overflow-hidden">
                  <div className="flex text-sm font-medium bg-gray-100">
                    <button
                      onClick={() => toggleResources(section.id)}
                      className={`px-3 py-1.5 flex items-center gap-1 ${section.isResourcesExpanded ? 'bg-white' : ''}`}
                    >
                      <Gauge className="w-3.5 h-3.5" /> Risorse
                    </button>
                    <button
                      onClick={() => {
                        if (section.isResourcesExpanded) {
                          toggleResources(section.id);
                        }
                      }}
                      className={`px-3 py-1.5 flex items-center gap-1 ${!section.isResourcesExpanded ? 'bg-white' : ''}`}
                    >
                      <SwatchBook className="h-3.5 w-3.5" /> Attività
                    </button>
                  </div>

                  {section.isResourcesExpanded && (
                    <div className="p-2 space-y-2">
                      <div className="max-h-60 overflow-y-auto space-y-1.5">
                        {section.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Input
                              placeholder="Resource name"
                              value={resource.name}
                              onChange={(e) =>
                                updateResource(section.id, resource.id, {
                                  name: e.target.value,
                                })
                              }
                              className="flex-1 min-w-[200px] h-8 text-sm"
                            />

                            <select
                              value={resource.type}
                              onChange={(e) =>
                                updateResource(section.id, resource.id, {
                                  type: e.target.value as ResourceType,
                                })
                              }
                              className="border rounded p-1 text-sm h-8"
                            >
                              <option value="hourly">Hourly</option>
                              <option value="quantity">Quantity</option>
                              <option value="fixed">Fixed</option>
                            </select>
                            
                            {resource.type !== "fixed" && (
                              <NumericInput
                                value={resource.rate}
                                onChange={(e) =>
                                  updateResource(section.id, resource.id, {
                                    rate: Number(e.target.value),
                                  })
                                }
                                className="w-20 h-8 text-sm"
                                placeholder={
                                  resource.type === "hourly"
                                    ? "Rate/h"
                                    : "Rate"
                                }
                              />
                            )}
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteResource(section.id, resource.id)
                              }
                              className="h-7 w-7"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addResource(section.id)}
                          className="h-7"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          risorse
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenResourceTemplateDialog(section.id)}
                          className="h-7"
                        >
                          <LayoutPanelTop className="h-3.5 w-3.5 mr-1" />
                          Template
                        </Button>
                      </div>
                    </div>
                  )}

                  {!section.isResourcesExpanded && (
                    <div className="p-2">
                      {/* Activities Matrix */}
                      <div className="max-h-60 overflow-auto border rounded-md">
                        <div className="overflow-x-auto" style={{ minWidth: "100%", maxWidth: "100%" }}>
                          <table className="min-w-full text-sm" style={{ tableLayout: "fixed" }}>
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-2 py-1 text-left font-bold w-80 min-w-[350px]">Attività</th>
                                <th className="px-2 py-1 text-center font-bold w-28 min-w-[120px] text-gray-500 opacity-70">Data Inizio</th>
                                <th className="px-2 py-1 text-center font-bold w-28 min-w-[120px] text-gray-500 opacity-70">Data Fine</th>
                                {section.resources.map((resource) => (
                                  <th key={resource.id} className="px-2 py-1 text-center font-bold min-w-[100px]">
                                    <div className="truncate w-24" title={resource.name}>
                                      {resource.name}
                                    </div>
                                  </th>
                                ))}
                                <th className="px-2 py-1 text-right font-bold w-24 min-w-[100px]">Totale</th>
                                <th className="w-8 min-w-[40px]"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.activities.map((activity) => (
                                <tr key={activity.id} className="border-t">
                                  <td className="px-2 py-1">
                                    <div className="flex items-center gap-1">
                                      <Input
                                        placeholder="Activity name"
                                        value={activity.name}
                                        onChange={(e) =>
                                          updateActivity(section.id, activity.id, {
                                            name: e.target.value,
                                          })
                                        }
                                        className="w-full h-7 text-sm font-bold min-w-[320px]"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenActivityDescription(section.id, activity.id)}
                                        title="Edit description"
                                        className="h-6 w-6 shrink-0"
                                      >
                                        <AlignLeft className={`h-3 w-3 ${activity.description ? 'text-blue-600' : 'text-gray-400'}`} />
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      type="date"
                                      value={activity.startDate || ""}
                                      onChange={(e) =>
                                        updateActivity(section.id, activity.id, {
                                          startDate: e.target.value || undefined,
                                        })
                                      }
                                      className="w-full h-7 text-sm"
                                      style={{
                                        colorScheme: 'light',
                                        opacity: activity.startDate ? 1 : 0.7,
                                        color: activity.startDate ? 'black' : '#666',
                                      }}
                                      placeholder="Data inizio"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <Input
                                      type="date"
                                      value={activity.endDate || ""}
                                      onChange={(e) =>
                                        updateActivity(section.id, activity.id, {
                                          endDate: e.target.value || undefined,
                                        })
                                      }
                                      className="w-full h-7 text-sm"
                                      style={{
                                        colorScheme: 'light',
                                        opacity: activity.endDate ? 1 : 0.7,
                                        color: activity.endDate ? 'black' : '#666',
                                      }}
                                      placeholder="Data fine"
                                    />
                                  </td>
                                  {section.resources.map((resource) => (
                                    <td key={resource.id} className="px-2 py-1">
                                      <NumericInput
                                        type="number"
                                        value={activity.resourceAllocations[resource.id] || ""}
                                        onChange={(e) =>
                                          updateActivity(section.id, activity.id, {
                                            resourceId: resource.id,
                                            allocation: Number(e.target.value) || 0,
                                          })
                                        }
                                        placeholder={
                                          resource.type === "hourly" 
                                            ? "h" 
                                            : resource.type === "quantity" 
                                            ? "q" 
                                            : "€"
                                        }
                                        suffix={
                                          resource.type === "hourly" 
                                            ? "h" 
                                            : resource.type === "quantity" 
                                            ? "q" 
                                            : "€"
                                        }
                                        className="text-center w-full h-7 text-sm min-w-[80px]"
                                      />
                                    </td>
                                  ))}
                                  <td className="px-2 py-1 text-right font-medium">
                                    {formatCurrency(calculateActivityCost(activity, section.resources))}
                                  </td>
                                  <td className="px-1 py-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteActivity(section.id, activity.id)}
                                      className="h-6 w-6"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-800" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addActivity(section.id)}
                        className="mt-2 h-7"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        attività
                      </Button>
                    </div>
                  )}
                </div>

                {/* Section Activities Timeline */}
                {(() => {
                  const { startDate, endDate } = calculateProjectTimeline(budget.section);
                  if (!startDate || !endDate) return null;
                  
                  const projectStart = new Date(startDate);
                  const projectEnd = new Date(endDate);
                  const projectDurationDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <SectionActivitiesTimeline 
                      section={section}
                      projectStart={projectStart}
                      projectEnd={projectEnd}
                      projectDurationDays={projectDurationDays}
                    />
                  );
                })()}

                {/* Section Total */}
                <div className="text-right text-sm font-semibold">
                  Totale sezione: {formatCurrency(calculateSectionTotal(section))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-3 mt-4">
        <div className="flex flex-wrap md:flex-nowrap gap-3">
          {/* Commercial Margin */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 transition-all hover:shadow-sm">
            <div className="flex items-center gap-1 mb-2 text-blue-800">
              <Gauge className="h-3.5 w-3.5 opacity-70" />
              <h3 className="text-sm font-semibold">Margine Commerciale</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <ValueTypeRadioGroup
                  value={budget.marginType}
                  onChange={(value) => updateBudget({ marginType: value })}
                  name="margin"
                />
              </div>
              <div className="relative w-28">
                <NumericInput
                  value={budget.commercialMargin}
                  onChange={(e) =>
                    updateBudget({ commercialMargin: Number(e.target.value) || 0 })
                  }
                  suffix={budget.marginType === "fixed" ? "€" : "%"}
                  className="w-full h-9 text-sm font-medium border-blue-200 focus-visible:ring-blue-400"
                />
                {/* <div className="absolute right-0 bottom-0 transform translate-y-5 text-xs text-blue-500">
                  {budget.marginType === "fixed" 
                    ? formatCurrency(budget.commercialMargin)
                    : `${budget.commercialMargin}% di ${formatCurrency(calculateTotal().baseTotal)}`}
                </div> */}
              </div>
            </div>
          </div>

          {/* Discount */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3 transition-all hover:shadow-sm">
            <div className="flex items-center gap-1 mb-2 text-amber-800">
              <SwatchBook className="h-3.5 w-3.5 opacity-70" />
              <h3 className="text-sm font-semibold">Sconto</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <ValueTypeRadioGroup
                  value={budget.discountType}
                  onChange={(value) => updateBudget({ discountType: value })}
                  name="discount"
                />
              </div>
              <div className="relative w-28">
                <NumericInput
                  value={budget.discount}
                  onChange={(e) =>
                    updateBudget({ discount: Number(e.target.value) || 0 })
                  }
                  suffix={budget.discountType === "fixed" ? "€" : "%"}
                  className="w-full h-9 text-sm font-medium border-amber-200 focus-visible:ring-amber-400"
                />
                {/* <div className="absolute right-0 bottom-0 transform translate-y-5 text-xs text-amber-500">
                  {budget.discountType === "fixed" 
                    ? formatCurrency(budget.discount)
                    : `${budget.discount}% di ${formatCurrency(calculateTotal().totalWithMargin)}`}
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Final Total */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 text-white shadow-sm">
          {(() => {
            const totals = calculateTotal();
            return (
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-300 flex items-center gap-1">
                    <span className="w-28">Totale sezioni:</span> 
                    <span className="font-medium">{formatCurrency(totals.baseTotal)}</span>
                  </p>
                  <p className="text-sm text-gray-300 flex items-center gap-1">
                    <span className="w-28">Margine:</span> 
                    <span className={`font-medium ${totals.marginAmount > 0 ? 'text-blue-300' : ''}`}>
                      {totals.marginAmount > 0 ? '+' : ''}{formatCurrency(totals.marginAmount)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300 flex items-center gap-1">
                    <span className="w-28">Sconto:</span> 
                    <span className={`font-medium ${totals.discountAmount > 0 ? 'text-amber-300' : ''}`}>
                      {totals.discountAmount > 0 ? '-' : ''}{formatCurrency(totals.discountAmount)}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-400">Budget totale</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(totals.finalTotal)}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default TechBudgetScreen;