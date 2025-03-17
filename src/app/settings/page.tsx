'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, ExternalLink, PanelLeft, ListFilter, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'


// Types
type TemplateType = 'section' | 'resource';

type ResourceType = "hourly" | "quantity" | "fixed";

interface TemplateBody {
  id: string;
  name: string;
  activities?: Activity[];   // Make these properties optional
  resources?: Resource[];
  type?: ResourceType;       // For resource template
  rate?: number;             // For resource template
  [key: string]: unknown;    // Allow additional properties
}

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  rate: number;
}

interface Activity {
  id: string;
  name: string;
  resourceAllocations: {
    [resourceId: string]: number;
  };
}

interface Template {
  id: number;
  created_at: string;
  user_id: string;
  body: TemplateBody;
  name: string;
  description: string;
  type: TemplateType;
}


interface SectionTemplate {
  id: string;
  name: string;
  activities: Activity[];
  resources: Resource[];
}

// Type guard to check if the passed data is a Template
function isTemplate(data: unknown): data is Template {
  return (
    typeof data === 'object' && 
    data !== null &&
    'id' in data && typeof data.id === 'number' &&
    'name' in data && typeof data.name === 'string' &&
    'type' in data && typeof data.type === 'string' &&
    ['section', 'resource'].includes(data.type as string)
  );
}

// Helper function to get badge style based on type
const getTypeBadgeStyle = (type: TemplateType): string => {
  switch (type) {
    case 'section':
      return 'bg-blue-200 text-blue-800';
    case 'resource':
      return 'bg-green-200 text-green-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
};

// Helper function to get icon based on type
const getTypeIcon = (type: TemplateType): React.ReactNode => {
  switch (type) {
    case 'section':
      return <PanelLeft className="h-4 w-4 mr-2" />;
    case 'resource':
      return <ListFilter className="h-4 w-4 mr-2" />;
    default:
      return null;
  }
};

// Format currency helper
const formatCurrency = (value: number): string => {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
};

// Table Component
interface TemplateTableProps {
  templates: Template[];
  onDuplicate: (template: Template) => void;
  onDelete: (template: Template) => void;
  onEdit: (template: Template) => void;
}

const TemplateTable: React.FC<TemplateTableProps> = ({ templates, onDuplicate, onDelete, onEdit }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Data Creazione</TableHead>
          <TableHead>Descrizione</TableHead>
          <TableHead>Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-6 text-gray-500">
              Nessun template trovato. Crea un nuovo template per iniziare.
            </TableCell>
          </TableRow>
        )}
        {templates.map((template) => (
          <TableRow 
            key={template.id} 
            className="hover:bg-gray-900 hover:text-white"
          >
            <TableCell className="font-bold">
              <div className="flex items-center">
                {getTypeIcon(template.type)}
                {template.name}
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getTypeBadgeStyle(template.type)}>
                {template.type}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(template.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="max-w-md">
              <div className="truncate">
                {template.description || 'Nessuna descrizione'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(template)}>
                  <Trash2 className="h-4 w-4 text-red-800" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// NumericInput Component
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

// Componente per le risorse con stato locale
const ResourceRow: React.FC<{
  resource: Resource;
  onUpdate: (id: string, updates: Partial<Resource>) => void;
  onDelete: (id: string) => void;
}> = React.memo(({ resource, onUpdate, onDelete }) => {
  // Stati locali per rendere la digitazione fluida
  const [localName, setLocalName] = useState(resource.name);
  const [localRate, setLocalRate] = useState(resource.rate);
  
  // Aggiorna lo stato locale quando la prop cambia
  useEffect(() => {
    setLocalName(resource.name);
    setLocalRate(resource.rate);
  }, [resource.id, resource.name, resource.rate]);
  
  // Aggiorna il valore nello stato genitore solo al blur
  const handleNameBlur = () => {
    if (localName !== resource.name) {
      onUpdate(resource.id, { name: localName });
    }
  };
  
  const handleRateBlur = () => {
    if (localRate !== resource.rate) {
      onUpdate(resource.id, { rate: localRate });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={handleNameBlur}
        placeholder="Nome risorsa"
        className="flex-1 min-w-[300px]"
      />

      <select
        value={resource.type}
        onChange={(e) =>
          onUpdate(resource.id, { type: e.target.value as ResourceType })
        }
        className="border rounded p-2 text-sm"
      >
        <option value="hourly">Hourly</option>
        <option value="quantity">Quantity</option>
        <option value="fixed">Fixed</option>
      </select>
      
      {resource.type !== "fixed" && (
        <NumericInput
          value={localRate}
          onChange={(e) => setLocalRate(Number(e.target.value))}
          onBlur={handleRateBlur}
          className="w-32"
          placeholder={resource.type === "hourly" ? "Rate/hour" : "Rate"}
        />
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(resource.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

ResourceRow.displayName = 'ResourceRow';

// Componente per le attività con stato locale
const ActivityRow: React.FC<{
  activity: Activity;
  resources: Resource[];
  onUpdate: (id: string, updates: Partial<Activity> | { resourceId: string; allocation: number }) => void;
  onDelete: (id: string) => void;
}> = React.memo(({ activity, resources, onUpdate, onDelete }) => {
  // Stato locale per il nome dell'attività
  const [localName, setLocalName] = useState(activity.name);
  
  // Stato locale per le allocazioni di risorse
  const [localAllocations, setLocalAllocations] = useState<{[key: string]: number}>(activity.resourceAllocations);
  
  // Aggiorna lo stato locale quando le props cambiano
  useEffect(() => {
    setLocalName(activity.name);
    setLocalAllocations(activity.resourceAllocations);
  }, [activity.id, activity.name, activity.resourceAllocations]);
  
  const handleNameBlur = () => {
    if (localName !== activity.name) {
      onUpdate(activity.id, { name: localName });
    }
  };
  
  const handleAllocationBlur = (resourceId: string, value: number) => {
    const currentValue = activity.resourceAllocations[resourceId] || 0;
    if (value !== currentValue) {
      onUpdate(activity.id, { resourceId, allocation: value });
    }
  };
  
  // Funzione per gestire cambiamenti locali alle allocazioni
  const handleAllocationChange = (resourceId: string, value: number) => {
    setLocalAllocations(prev => ({
      ...prev,
      [resourceId]: value
    }));
  };

  // Calculate activity cost
  const calculateActivityCost = (activity: Activity, resources: Resource[]): number => {
    return resources.reduce((total, resource) => {
      const allocation = activity.resourceAllocations[resource.id] || 0;
      if (resource.type === "fixed") {
        return total + allocation;
      }
      return total + allocation * resource.rate;
    }, 0);
  };

  return (
    <div 
      className="grid gap-4 mb-2" 
      style={{
        gridTemplateColumns: resources.length > 0 
          ? `300px repeat(${resources.length}, minmax(150px, 1fr)) 100px`
          : "1fr auto",
      }}
    >
      <div className="flex items-center gap-2">
        <Input
          placeholder="Activity name"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
        />
      </div>

      {resources.map(resource => {
        const allocation = localAllocations[resource.id] || 0;
        return (
          <div key={resource.id}>
            <NumericInput
              type="number"
              value={allocation}
              onChange={(e) => handleAllocationChange(resource.id, Number(e.target.value) || 0)}
              onBlur={() => handleAllocationBlur(resource.id, allocation)}
              placeholder={
                resource.type === "hourly" 
                  ? "Hours" 
                  : resource.type === "quantity" 
                  ? "Quantity" 
                  : "Cost"
              }
              suffix={
                resource.type === "hourly" 
                  ? "h" 
                  : resource.type === "quantity" 
                  ? "q" 
                  : "€"
              }
              className="text-center w-full font-light"
            />
          </div>
        );
      })}

      <div className="flex items-center gap-2 font-semibold text-sm">
        {resources.length > 0 && (
          <span className="flex-1">
            {formatCurrency(calculateActivityCost(activity, resources))}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(activity.id)}
        >
          <Trash2 className="h-4 w-4 text-red-800" />
        </Button>
      </div>
    </div>
  );
});
ActivityRow.displayName = 'ActivityRow';

// Main component
const ProjectBudgetTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TemplateType | 'all'>('all');
  
  // Form states
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateDescription, setNewTemplateDescription] = useState<string>('');
  const [newTemplateType, setNewTemplateType] = useState<TemplateType>('section');
  const [newTemplateBody, setNewTemplateBody] = useState<TemplateBody>({} as TemplateBody);

  // Section editor states
  const [sectionName, setSectionName] = useState<string>('');
  const [sectionResources, setSectionResources] = useState<Resource[]>([]);
  const [sectionActivities, setSectionActivities] = useState<Activity[]>([]);
  const [isResourcesExpanded, setIsResourcesExpanded] = useState<boolean>(true);
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState<boolean>(true);
  
  // Default JSON structures
  const defaultBodies: Record<TemplateType, TemplateBody> = {
    section: {
      id: uuidv4(),
      name: "New Section",
      activities: [],
      resources: []
    },
    resource: {
      id: uuidv4(),
      name: "New Resource",
      type: "hourly",
      rate: 0
    }
  };

  

  // Fetch templates from supabase
  const fetchTemplates = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('db_projectbudget')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const validTemplates = data.filter(isTemplate);
      setTemplates(validTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Create new template
  const createTemplate = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let bodyToSave;
      
      if (newTemplateType === 'section') {
        bodyToSave = {
          id: uuidv4(),
          name: sectionName,
          activities: sectionActivities,
          resources: sectionResources
        };
      } else {
        bodyToSave = newTemplateBody;
      }

      const {  error } = await supabase
        .from('db_projectbudget')
        .insert([
          {
            user_id: user.id,
            name: newTemplateName,
            description: newTemplateDescription,
            type: newTemplateType,
            body: bodyToSave
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchTemplates();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  // Duplicate template
  const handleDuplicate = async (template: Template): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('db_projectbudget')
        .insert([
          {
            user_id: user.id,
            name: `${template.name} (Copy)`,
            description: template.description,
            type: template.type,
            body: template.body
          }
        ])
        .select();

      if (error) throw error;

      await fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  // Delete template
  const handleDelete = async (): Promise<void> => {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('db_projectbudget')
        .delete()
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      await fetchTemplates();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  // Edit template
  const handleEdit = (template: Template): void => {
    setSelectedTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateDescription(template.description);
    setNewTemplateType(template.type);
    
    if (template.type === 'section') {
      const sectionData = template.body as SectionTemplate;
      setSectionName(sectionData.name);
      setSectionResources(sectionData.resources || []);
      setSectionActivities(sectionData.activities || []);
    } else {
      setNewTemplateBody(template.body);
    }
    
    setIsEditDialogOpen(true);
  };

  // Update template
  const updateTemplate = async (): Promise<void> => {
    if (!selectedTemplate) return;

    try {
      let bodyToSave;
      
      if (newTemplateType === 'section') {
        bodyToSave = {
          id: (selectedTemplate.body?.id || uuidv4()),
          name: sectionName,
          activities: sectionActivities,
          resources: sectionResources
        };
      } else {
        bodyToSave = newTemplateBody;
      }

      const { error } = await supabase
        .from('db_projectbudget')
        .update({
          name: newTemplateName,
          description: newTemplateDescription,
          type: newTemplateType,
          body: bodyToSave
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      await fetchTemplates();
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  // Reset form
  const resetForm = (): void => {
    setNewTemplateName('');
    setNewTemplateDescription('');
    setNewTemplateType('section');
    setNewTemplateBody(defaultBodies.section);
    setSectionName('New Section');
    setSectionResources([]);
    setSectionActivities([]);
    setSelectedTemplate(null);
  };

  // Handle type change in form
  const handleTypeChange = (type: TemplateType): void => {
    setNewTemplateType(type);
    
    if (type === 'section') {
      setSectionName('New Section');
      setSectionResources([]);
      setSectionActivities([]);
    } else {
      setNewTemplateBody(defaultBodies.resource);
    }
  };

  // Section management functions
  const addResource = (): void => {
    setSectionResources([
      ...sectionResources,
      {
        id: uuidv4(),
        name: "New Resource",
        type: "hourly" as ResourceType,
        rate: 0
      }
    ]);
  };

  const updateResource = (
    resourceId: string,
    updates: Partial<Resource>
  ): void => {
    setSectionResources(
      sectionResources.map(resource =>
        resource.id === resourceId ? { ...resource, ...updates } : resource
      )
    );
  };

  const deleteResource = (resourceId: string): void => {
    setSectionResources(sectionResources.filter(r => r.id !== resourceId));
    
    // Also remove resource references from activities
    setSectionActivities(
      sectionActivities.map(activity => ({
        ...activity,
        resourceAllocations: Object.fromEntries(
          Object.entries(activity.resourceAllocations).filter(
            ([key]) => key !== resourceId
          )
        )
      }))
    );
  };

  const addActivity = (): void => {
    setSectionActivities([
      ...sectionActivities,
      {
        id: uuidv4(),
        name: "New Activity",
        resourceAllocations: {}
      }
    ]);
  };

  const updateActivity = (
    activityId: string,
    updates: Partial<Activity> | { resourceId: string; allocation: number }
  ): void => {
    setSectionActivities(
      sectionActivities.map(activity => {
        if (activity.id === activityId) {
          if ("resourceId" in updates) {
            return {
              ...activity,
              resourceAllocations: {
                ...activity.resourceAllocations,
                [updates.resourceId]: updates.allocation
              }
            };
          }
          return { ...activity, ...updates };
        }
        return activity;
      })
    );
  };

  const deleteActivity = (activityId: string): void => {
    setSectionActivities(sectionActivities.filter(a => a.id !== activityId));
  };

  // Filter templates by type
  const getFilteredTemplates = (): Template[] => {
    if (currentFilter === 'all') return templates;
    return templates.filter(template => template.type === currentFilter);
  };

  // Initialize
  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Initialize section data when editing a section template
    if (selectedTemplate && selectedTemplate.type === 'section' && selectedTemplate.body) {
      const sectionData = selectedTemplate.body as SectionTemplate;
      setSectionName(sectionData.name || 'New Section');
      setSectionResources(sectionData.resources || []);
      setSectionActivities(sectionData.activities || []);
    }
  }, [selectedTemplate]);

  // Section editor component
  const SectionEditor: React.FC = () => {
    // Stato locale per il nome della sezione
    const [localSectionName, setLocalSectionName] = useState(sectionName);
    
    useEffect(() => {
      setLocalSectionName(sectionName);
    }, [sectionName]);
    
    const handleSectionNameBlur = () => {
      if (localSectionName !== sectionName) {
        setSectionName(localSectionName);
      }
    };
    
    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="section-name">Nome Sezione</Label>
          <Input 
            id="section-name" 
            value={localSectionName} 
            onChange={(e) => setLocalSectionName(e.target.value)}
            onBlur={handleSectionNameBlur}
            placeholder="Nome della sezione" 
            className="font-bold"
          />
        </div>

        {/* Resources Section */}
        <div className="space-y-2 border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
              className="p-1 hover:bg-gray-200 bg-gray-100 rounded flex gap-2 justify-center items-center font-bold text-sm"
            >
              {isResourcesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <ListFilter className="w-4 h-4" /> Risorse
            </button>
          </div>
          
          {isResourcesExpanded && (
            <div className="space-y-2">
              {sectionResources.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  onUpdate={updateResource}
                  onDelete={deleteResource}
                />
              ))}
              <Button
                variant="outline"
                onClick={addResource}
              >
                <Plus className="h-4 w-4 mr-2" />
                aggiungi risorsa
              </Button>
            </div>
          )}
        </div>

        {/* Activities Section */}
        <div className="space-y-2 border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsActivitiesExpanded(!isActivitiesExpanded)}
              className="p-1 hover:bg-gray-200 bg-gray-100 rounded flex gap-2 justify-center items-center font-bold text-sm"
            >
              {isActivitiesExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <ListFilter className="w-4 h-4" /> Attività
            </button>
          </div>
          
          {isActivitiesExpanded && (
            <div className="space-y-4">
              {/* Activities matrix header */}
              {sectionResources.length > 0 && (
                <div className="grid gap-4 px-4" 
                  style={{
                    gridTemplateColumns: `300px repeat(${sectionResources.length}, minmax(150px, 1fr)) 100px`,
                  }}
                >
                  <div></div>
                  {sectionResources.map(resource => (
                    <div key={resource.id} className="text-center text-sm font-medium whitespace-normal px-2">
                      {resource.name}
                    </div>
                  ))}
                  <div></div>
                </div>
              )}

              {/* Activities rows */}
              {sectionActivities.map(activity => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  resources={sectionResources}
                  onUpdate={updateActivity}
                  onDelete={deleteActivity}
                />
              ))}

              <Button
                variant="outline"
                onClick={addActivity}
              >
                <Plus className="h-4 w-4 mr-2" />
                aggiungi attività
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Resource editor component
  const ResourceEditor: React.FC = () => {
    // Stati locali
    const [localName, setLocalName] = useState(newTemplateBody.name || '');
    const [localRate, setLocalRate] = useState(newTemplateBody.rate || 0);
    
    useEffect(() => {
      setLocalName(newTemplateBody.name || '');
      setLocalRate(newTemplateBody.rate || 0);
    }, [newTemplateBody.name, newTemplateBody.rate]);
    
    const handleNameBlur = () => {
      setNewTemplateBody({...newTemplateBody, name: localName});
    };
    
    const handleRateBlur = () => {
      setNewTemplateBody({...newTemplateBody, rate: localRate});
    };
    
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="resource-name">Nome Risorsa</Label>
          <Input 
            id="resource-name" 
            value={localName} 
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Nome della risorsa"
          />
        </div>
        
        <div>
          <Label htmlFor="resource-type">Tipo</Label>
          <select
            id="resource-type"
            value={newTemplateBody.type || 'hourly'}
            onChange={(e) => setNewTemplateBody({...newTemplateBody, type: e.target.value as ResourceType})}
            className="w-full p-2 border rounded"
          >
            <option value="hourly">Hourly</option>
            <option value="quantity">Quantity</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        
        {newTemplateBody.type !== 'fixed' && (
          <div>
            <Label htmlFor="resource-rate">Rate</Label>
            <NumericInput
              id="resource-rate" 
              type="number"
              value={localRate} 
              onChange={(e) => setLocalRate(Number(e.target.value))}
              onBlur={handleRateBlur}
              placeholder="Tariffa"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 p-8">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">⚡Template Manager</h1>
              <p className="text-gray-500 mb-6 text-sm">
                Gestisci i tuoi template per creare budget più rapidamente.
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> nuovo template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Template</DialogTitle>
                  <DialogDescription>
                    Inserisci i dettagli per il nuovo template.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input 
                        id="name" 
                        value={newTemplateName} 
                        onChange={(e) => setNewTemplateName(e.target.value)} 
                        placeholder="Nome del template"
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <RadioGroup 
                        value={newTemplateType} 
                        onValueChange={(value) => handleTypeChange(value as TemplateType)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="section" id="section" />
                          <Label htmlFor="section">Sezione</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="resource" id="resource" />
                          <Label htmlFor="resource">Risorsa</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea 
                      id="description" 
                      value={newTemplateDescription} 
                      onChange={(e) => setNewTemplateDescription(e.target.value)} 
                      placeholder="Descrivi brevemente questo template"
                    />
                  </div>
                  
                  <div>
                    <Label>Configurazione Template</Label>
                    <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
                      {newTemplateType === 'section' && <SectionEditor />}
                      {newTemplateType === 'resource' && <ResourceEditor />}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button onClick={createTemplate}>
                    Salva Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="all" onValueChange={(value) => setCurrentFilter(value as TemplateType | 'all')}>
            <TabsList>
              <TabsTrigger value="all" className="data-[state=active]:bg-black data-[state=active]:text-white">
                Tutti
              </TabsTrigger>
              <TabsTrigger value="section" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <PanelLeft className="h-4 w-4 mr-2" /> Sezioni
              </TabsTrigger>
              <TabsTrigger value="resource" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                <ListFilter className="h-4 w-4 mr-2" /> Risorse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TemplateTable 
                templates={getFilteredTemplates()} 
                onDuplicate={handleDuplicate}
                onDelete={(template) => {
                  setSelectedTemplate(template);
                  setShowDeleteDialog(true);
                }}
                onEdit={handleEdit}
              />
            </TabsContent>
            
            <TabsContent value="section" className="mt-4">
              <TemplateTable 
                templates={getFilteredTemplates()} 
                onDuplicate={handleDuplicate}
                onDelete={(template) => {
                  setSelectedTemplate(template);
                  setShowDeleteDialog(true);
                }}
                onEdit={handleEdit}
              />
            </TabsContent>
            
            <TabsContent value="resource" className="mt-4">
              <TemplateTable 
                templates={getFilteredTemplates()} 
                onDuplicate={handleDuplicate}
                onDelete={(template) => {
                  setSelectedTemplate(template);
                  setShowDeleteDialog(true);
                }}
                onEdit={handleEdit}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Template</DialogTitle>
            <DialogDescription>
              Modifica i dettagli del template selezionato.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input 
                  id="edit-name" 
                  value={newTemplateName} 
                  onChange={(e) => setNewTemplateName(e.target.value)} 
                  placeholder="Nome del template"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <RadioGroup 
                  value={newTemplateType} 
                  onValueChange={(value) => handleTypeChange(value as TemplateType)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="section" id="edit-section" />
                    <Label htmlFor="edit-section">Sezione</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="resource" id="edit-resource" />
                    <Label htmlFor="edit-resource">Risorsa</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Descrizione</Label>
              <Textarea 
                id="edit-description" 
                value={newTemplateDescription} 
                onChange={(e) => setNewTemplateDescription(e.target.value)} 
                placeholder="Descrivi brevemente questo template"
              />
            </div>
            
            <div>
              <Label>Configurazione Template</Label>
              <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
                {newTemplateType === 'section' && <SectionEditor />}
                {newTemplateType === 'resource' && <ResourceEditor />}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={updateTemplate}>
              Aggiorna Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il template &quot;{selectedTemplate?.name}&quot;? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectBudgetTemplateManager;