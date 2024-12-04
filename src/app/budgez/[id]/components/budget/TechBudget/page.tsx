import React from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Gauge, SwatchBook, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

type ResourceType = 'fixed' | 'hourly';

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  rate: number; // hourly rate or fixed cost
}

interface Activity {
  id: string;
  name: string;
  resourceAllocations: { [resourceId: string]: number }; // hours or quantity
}

interface BudgetSection {
  id: string;
  name: string;
  isExpanded: boolean;
  activities: Activity[];
  resources: Resource[];
}

interface BudgetData {
  sections: BudgetSection[];
  commercialMargin: number;
  marginType: 'fixed' | 'percentage';
  discount: number;
  discountType: 'fixed' | 'percentage';
}

interface Props {
  onUpdate: (data: Budget) => void;
  initialData?: {
    section?: BudgetSection[];
    commercial_margin?: number;
    margin_type?: 'fixed' | 'percentage';
    discount?: number;
    discount_type?: 'fixed' | 'percentage';
  };
}

const DEFAULT_BUDGET: BudgetData = {
  sections: [{
    id: uuidv4(),
    name: 'New Section',
    isExpanded: false,
    activities: [],
    resources: []
  }],
  commercialMargin: 0,
  marginType: 'fixed',
  discount: 0,
  discountType: 'fixed'
};

const TechBudget: React.FC<Props> = ({ onUpdate, initialData }) => {
  const [budget, setBudget] = React.useState<BudgetData>(() => {
    if (!initialData) return DEFAULT_BUDGET;
    return {
      sections: initialData.section || DEFAULT_BUDGET.sections,
      commercialMargin: initialData.commercial_margin || 0,
      marginType: initialData.margin_type || 'fixed', 
      discount: initialData.discount || 0,
      discountType: initialData.discount_type || 'fixed'
    };
  });

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    });
  };

  const calculateActivityCost = (activity: Activity, resources: Resource[]): number => {
    return resources.reduce((total, resource) => {
      const allocation = activity.resourceAllocations[resource.id] || 0;
      if (resource.type === 'hourly') {
        return total + (allocation * resource.rate);
      }
      return total + (allocation * resource.rate);
    }, 0);
  };

  const calculateSectionTotal = (section: BudgetSection): number => {
    return section.activities.reduce((total, activity) => 
      total + calculateActivityCost(activity, section.resources), 0);
  };

  const calculateTotal = (): {
    baseTotal: number;
    totalWithMargin: number;
    marginAmount: number;
    discountAmount: number;
    finalTotal: number;
  } => {
    // 1. Calcolo il totale base (somma delle sezioni)
    const baseTotal = budget.sections.reduce(
      (sum, section) => sum + calculateSectionTotal(section),
      0
    );
    
    // 2. Calcolo il margine (fisso o percentuale)
    const marginAmount = budget.marginType === 'fixed' 
      ? budget.commercialMargin 
      : baseTotal * (budget.commercialMargin / 100);
    
    // 3. Calcolo il totale con il margine
    const totalWithMargin = baseTotal + marginAmount;
    
    // 4. Calcolo lo sconto sul totale marginato
    const discountAmount = budget.discountType === 'fixed'
      ? budget.discount
      : totalWithMargin * (budget.discount / 100);
    
    // 5. Calcolo il totale finale (totale marginato - sconto)
    const finalTotal = totalWithMargin - discountAmount;

    return {
      baseTotal,
      totalWithMargin,
      marginAmount,
      discountAmount,
      finalTotal
    };
  };

  const toggleSection = (sectionId: string) => {
    const newSections = budget.sections.map(section => 
      section.id === sectionId 
        ? { ...section, isExpanded: !section.isExpanded }
        : section
    );
    updateBudget({ sections: newSections });
  };

  const addSection = () => {
    updateBudget({
      sections: [
        ...budget.sections,
        {
          id: uuidv4(),
          name: 'New Section',
          isExpanded: false,
          activities: [],
          resources: []
        }
      ]
    });
  };

  const addActivity = (sectionId: string) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          activities: [
            ...section.activities,
            {
              id: uuidv4(),
              name: 'New Activity',
              resourceAllocations: {}
            }
          ]
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const addResource = (sectionId: string) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          resources: [
            ...section.resources,
            {
              id: uuidv4(),
              name: 'New Resource',
              type: 'hourly',
              rate: 0
            }
          ]
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const updateResource = (sectionId: string, resourceId: string, updates: Partial<Resource>) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          resources: section.resources.map(resource =>
            resource.id === resourceId
              ? { ...resource, ...updates }
              : resource
          )
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const updateActivity = (
    sectionId: string,
    activityId: string,
    updates: Partial<Activity> | { resourceId: string; allocation: number }
  ) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          activities: section.activities.map(activity => {
            if (activity.id === activityId) {
              if ('resourceId' in updates) {
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
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const deleteSection = (sectionId: string) => {
    updateBudget({
      sections: budget.sections.filter(section => section.id !== sectionId)
    });
  };

  const deleteActivity = (sectionId: string, activityId: string) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          activities: section.activities.filter(activity => activity.id !== activityId)
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const deleteResource = (sectionId: string, resourceId: string) => {
    const newSections = budget.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          resources: section.resources.filter(resource => resource.id !== resourceId),
          activities: section.activities.map(activity => ({
            ...activity,
            resourceAllocations: Object.fromEntries(
              Object.entries(activity.resourceAllocations)
                .filter(([key]) => key !== resourceId)
            )
          }))
        };
      }
      return section;
    });
    updateBudget({ sections: newSections });
  };

  const updateBudget = (newData: Partial<BudgetData>) => {
    const updated = { ...budget, ...newData };
    setBudget(updated);
    onUpdate({
      section: updated.sections,
      commercial_margin: updated.commercialMargin,
      margin_type: updated.marginType,
      discount: updated.discount,
      discount_type: updated.discountType
    });
  };

  return (
    <div className="space-y-6">
      {/* Sections */}
      <div className="space-y-4">
        {budget.sections.map((section) => (
          <div key={section.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {section.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <Input
                placeholder="Section name"
                value={section.name}
                onChange={(e) => {
                  const newSections = budget.sections.map(s =>
                    s.id === section.id ? { ...s, name: e.target.value } : s
                  );
                  updateBudget({ sections: newSections });
                }}
                className="flex-1"
              />
              <div className='font-bold'>{formatCurrency(calculateSectionTotal(section))}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSection(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {section.isExpanded && (
              <div className="pl-6 space-y-4">
                {/* Resources Header */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex gap-1"> <Gauge className='w-5 h-5' /> Resources</h3>
                  <div className="space-y-2">
                    {section.resources.map((resource) => (
                      <div key={resource.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Resource name"
                          value={resource.name}
                          onChange={(e) => updateResource(section.id, resource.id, { name: e.target.value })}
                          className="flex-1"
                        />
                        <select
                          value={resource.type}
                          onChange={(e) => updateResource(section.id, resource.id, { type: e.target.value as ResourceType })}
                          className="border rounded p-2"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="fixed">Fixed</option>
                        </select>
                        <Input
                          type="number"
                          value={resource.rate}
                          onChange={(e) => updateResource(section.id, resource.id, { rate: Number(e.target.value) })}
                          className="w-32"
                          placeholder={resource.type === 'hourly' ? 'Rate/hour' : 'Fixed cost'}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteResource(section.id, resource.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => addResource(section.id)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </div>
                </div>

                {/* Activities and Matrix */}
                <div className="space-y-2">
                  
                  <div className="space-y-4">
                    <div className="grid gap-4" style={{
                      gridTemplateColumns: `minmax(200px, 1fr) repeat(${section.resources.length}, minmax(100px, 1fr)) auto`
                    }}>
                      <div className="font-semibold flex gap-1"> <SwatchBook className='h-5 w-5'/> Activity</div>
                      {section.resources.map((resource) => (
                        <div key={resource.id} className=" text-center">
                          {resource.name}
                        </div>
                      ))}
                      <div>Total</div>
                    </div>

                    {section.activities.map((activity) => (
                      <div key={activity.id} className="grid gap-4" style={{
                        gridTemplateColumns: `minmax(200px, 1fr) repeat(${section.resources.length}, minmax(100px, 1fr)) auto`
                      }}>
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Activity name"
                            value={activity.name}
                            onChange={(e) => updateActivity(section.id, activity.id, { name: e.target.value })}
                          />
                        </div>
                        {section.resources.map((resource) => (
                          <div key={resource.id}>
                            <Input
                              type="number"
                              value={activity.resourceAllocations[resource.id] || ''}
                              onChange={(e) => updateActivity(section.id, activity.id, {
                                resourceId: resource.id,
                                allocation: Number(e.target.value) || 0
                              })}
                              placeholder={resource.type === 'hourly' ? 'Hours' : 'Quantity'}
                              className="text-center"
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-2">
                          <span className="flex-1">
                            {formatCurrency(calculateActivityCost(activity, section.resources))}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteActivity(section.id, activity.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => addActivity(section.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                {/* Section Total */}
                <div className="pt-4 border-t">
                  <p className="text-lg font-semibold">
                    Total: {formatCurrency(calculateSectionTotal(section))}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
        <Button variant="outline" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
      </div>

      {/* Commercial Margin */}
      <div>
        <h2 className="text-base font-semibold mb-2">Margine Commerciale</h2>
        <RadioGroup 
          value={budget.marginType}
          onValueChange={(value: 'fixed' | 'percentage') => updateBudget({ marginType: value })}
          className="flex items-center space-x-4 mb-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="margin-fixed" />
            <Label htmlFor="margin-fixed">Fixed (€)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="margin-percentage" />
            <Label htmlFor="margin-percentage">Percentage (%)</Label>
          </div>
        </RadioGroup>
        <Input
          type="number"
          value={budget.commercialMargin}
          onChange={(e) => updateBudget({ commercialMargin: Number(e.target.value) || 0 })}
          className="max-w-xs"
        />
      </div>

      {/* Discount */}
      <div>
        <h2 className="text-base font-semibold mb-2">Sconto</h2>
        <RadioGroup 
          value={budget.discountType}
          onValueChange={(value: 'fixed' | 'percentage') => updateBudget({ discountType: value })}
          className="flex items-center space-x-4 mb-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="discount-fixed" />
            <Label htmlFor="discount-fixed">Fixed (€)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="discount-percentage" />
            <Label htmlFor="discount-percentage">Percentage (%)</Label>
          </div>
        </RadioGroup>
        <Input
          type="number"
          value={budget.discount}
          onChange={(e) => updateBudget({ discount: Number(e.target.value) || 0 })}
          className="max-w-xs"
        />
      </div>

      {/* Totals */}
      <div className="pt-4 border-t">
        <div className="space-y-2 text-base">
          {(() => {
            const totals = calculateTotal();
            return (
              <>
                <p className='text-gray-700'>Totale sezioni: {formatCurrency(totals.baseTotal)}</p>
                <p className='text-gray-700'>Margine Commerciale: {formatCurrency(totals.marginAmount)}</p>
                <p className="font-bold">Budget Totale Marginato: {formatCurrency(totals.totalWithMargin)}</p>
                <p className='text-gray-700'>Sconto: {formatCurrency(totals.discountAmount)}</p>
                <p className="text-2xl font-bold">Imponibile Totale: {formatCurrency(totals.finalTotal)}</p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default TechBudget;