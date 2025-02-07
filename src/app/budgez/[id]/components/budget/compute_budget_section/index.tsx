import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Gauge,
  SwatchBook,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  Activity,
  Budget,
  Resource,
  ResourceType,
  SupabaseBudgetData,
} from "../../../page";
import ResourceAutocomplete from "./components/resourceautocomplete";

// Types

interface TBBudgetSection {
  id: string;
  name: string;
  isExpanded: boolean;
  isResourcesExpanded: boolean; 
  activities: Activity[];
  resources: Resource[];
}

interface RawSection {
  id: string;
  name: string;
  activities?: Activity[];
  resources?: Resource[];
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
          }))
        : DEFAULT_BUDGET.section,
      commercialMargin: initialData.commercial_margin || 0,
      marginType: initialData.margin_type || "fixed",
      discount: initialData.discount || 0,
      discountType: initialData.discount_type || "fixed",
    } as TBBudgetData;
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

  const handleResourceSelect = (sectionId: string, resourceId: string) => 
    (resource: { name: string; type: ResourceType; rate: number }) => {
      let resourceType: ResourceType = "hourly"; // default
      
      // Map resource type to our resource types
      if (resource.type === "fixed") {
        resourceType = "fixed";
      } else if (resource.type === "quantity") {
        resourceType = "quantity";
      }
  
      updateResource(sectionId, resourceId, {
        name: resource.name,
        type: resourceType,
        rate: resource.rate
      });
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
        },
      ],
    });
  };

  const addActivity = (sectionId: string) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      activities: [
        ...section.activities,
        {
          id: uuidv4(),
          name: "New Activity",
          resourceAllocations: {},
        },
      ],
    }));
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
    updates: Partial<Activity> | { resourceId: string; allocation: number }
  ) => {
    const newSections = updateSectionById(budget.section, sectionId, section => ({
      ...section,
      activities: section.activities.map(activity => {
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
      }),
    }));
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
        activities: section.activities,
        resources: section.resources
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
    <div className="space-y-6 p-4">
      {/* Sections */}
      <div className="space-y-4">
        {budget.section.map((section) => (
          <div key={section.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="p-1 hover:bg-gray-100 rounded"
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
                className="flex-1"
              />
              <div className="font-bold">
                {formatCurrency(calculateSectionTotal(section))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSection(section.id)}
              >
                <Trash2 className="h-4 w-4 text-red-800" />
              </Button>
            </div>

            {section.isExpanded && (
              <div className="space-y-4">
                {/* Resources Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleResources(section.id)}
                      className="p-1 hover:bg-gray-200 bg-gray-100 rounded flex gap-2 justify-center items-center font-bold text-sm"
                    >
                      {section.isResourcesExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Gauge className="w-4 h-4" /> Resources
                    </button>
                  </div>
                  
                  {section.isResourcesExpanded && (
                    <div className="space-y-2">
                      {section.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center gap-2"
                        >
                          <ResourceAutocomplete
                            value={resource.name}
                            onChange={(value) =>
                              updateResource(section.id, resource.id, {
                                name: value,
                              })
                            }
                            onResourceSelect={handleResourceSelect(section.id, resource.id)}
                            className="flex-1"
                          />

                          <select
                            value={resource.type}
                            onChange={(e) =>
                              updateResource(section.id, resource.id, {
                                type: e.target.value as ResourceType,
                              })
                            }
                            className="border rounded p-2 text-sm"
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
                              className="w-32"
                              placeholder={
                                resource.type === "hourly"
                                  ? "Rate/hour"
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => addResource(section.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>
                  )}
                </div>

                {/* Activities and Matrix */}
                <div className="space-y-2">
                  {/* Header fisso */}
                  <div className="font-semibold flex gap-1 px-4">
                    <SwatchBook className="h-5 w-5" /> Activity
                  </div>

                  {/* Container della matrice con scroll */}
                  <div className="border rounded-lg">
                    <div className="max-w-full overflow-x-auto">
                      <div className="w-[10vw]">
                        {/* Header delle colonne */}
                        <div
                          className="grid gap-4 px-4 py-2"
                          style={{
                            gridTemplateColumns: `200px repeat(${section.resources.length}, minmax(150px, 1fr)) 100px`,
                          }}
                        >
                          <div></div>
                          {section.resources.map((resource) => (
                            <div key={resource.id} className="text-center text-sm font-medium whitespace-normal px-2">
                              {resource.name}
                            </div>
                          ))}
                          <div></div>
                        </div>

                        {/* Righe delle attività */}
                        <div className="px-4 py-2">
                          {section.activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="grid gap-4 mb-2"
                              style={{
                                gridTemplateColumns: `200px repeat(${section.resources.length}, minmax(150px, 1fr)) 100px`,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Activity name"
                                  value={activity.name}
                                  onChange={(e) =>
                                    updateActivity(section.id, activity.id, {
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              {section.resources.map((resource) => (
                                <div key={resource.id}>
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
                              ))}
                              <div className="flex items-center gap-2 font-semibold text-sm">
                                <span className="flex-1">
                                  {formatCurrency(
                                    calculateActivityCost(activity, section.resources)
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    deleteActivity(section.id, activity.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-800" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => addActivity(section.id)}
                  >
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
        <ValueTypeRadioGroup
          value={budget.marginType}
          onChange={(value) => updateBudget({ marginType: value })}
          name="margin"
        />
        <NumericInput
          value={budget.commercialMargin}
          onChange={(e) =>
            updateBudget({ commercialMargin: Number(e.target.value) || 0 })
          }
          suffix={budget.marginType === "fixed" ? "€" : "%"}
          className="max-w-xs"
        />
      </div>

      {/* Discount */}
      <div>
        <h2 className="text-base font-semibold mb-2">Sconto</h2>
        <ValueTypeRadioGroup
          value={budget.discountType}
          onChange={(value) => updateBudget({ discountType: value })}
          name="discount"
        />
        <NumericInput
          value={budget.discount}
          onChange={(e) =>
            updateBudget({ discount: Number(e.target.value) || 0 })
          }
          suffix={budget.discountType === "fixed" ? "€" : "%"}
          className="max-w-xs"
        />
      </div>

      {/* Totals */}
      <div className="pt-4 border-t bg-gray-900 rounded-lg p-2 text-gray-100">
        <div className="space-y-2 text-base">
          {(() => {
            const resourceTotals = calculateResourceTypeTotals();
            return (
              <div className="gap-4 mb-4 p-2 bg-gray-800 rounded justify-end">
                <div className="flex items-center justify-start gap-2">
                  <p className="text-gray-400 text-sm">Ore</p>
                  <p className="font-semibold">{resourceTotals.hourlyHours.toFixed(1)}h</p>
                  <p className="text-sm">{formatCurrency(resourceTotals.hourlyTotal)}</p>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <p className="text-gray-400 text-sm">Quantità</p>
                  <p className="font-semibold">{resourceTotals.quantityAmount.toFixed(1)}q</p>
                  <p className="text-sm">{formatCurrency(resourceTotals.quantityTotal)}</p>
                </div>
                <div className="flex items-center justify-start gap-2">
                  <p className="text-gray-400 text-sm">Spese Fisse</p>
                  <p className="font-semibold">{formatCurrency(resourceTotals.fixedTotal)}</p>
                </div>
              </div>
            );
          })()}

          {(() => {
            const totals = calculateTotal();
            return (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-300">
                      Totale sezioni: {formatCurrency(totals.baseTotal)}
                    </p>
                    <p className="text-gray-300">
                      Margine Commerciale: {formatCurrency(totals.marginAmount)}
                    </p>
                    <p className="font-bold">
                      Budget Totale Marginato: {formatCurrency(totals.totalWithMargin)}
                    </p>
                    <p className="text-gray-300">
                      Sconto: {formatCurrency(totals.discountAmount)}
                    </p>
                  </div>
                  
                  <p className="text-3xl font-bold">
                    Totale: {formatCurrency(totals.finalTotal)}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default TechBudgetScreen;