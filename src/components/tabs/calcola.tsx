import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  ContactRound,
  Hammer,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";

// Types
interface Resource {
  id: string;
  name: string;
  type: "hourly" | "quantity" | "fixed";
  rate: number;
}


interface Activity {
  id: string;
  name: string;
  resourceAllocations: { [key: string]: number };
}

interface BudgetSection {
  id: string;
  name: string;
  isExpanded: boolean;
  activities: Activity[];
  resources: Resource[];
}

interface BudgetData {
  section: BudgetSection[];
  commercialMargin: number;
  marginType: "fixed" | "percentage";
  discount: number;
  discountType: "fixed" | "percentage";
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const DEFAULT_BUDGET: BudgetData = {
    section: [
      {
        id: generateId(),
        name: "Sezione senza titolo",
        isExpanded: false,
        activities: [],
        resources: [],
      },
    ],
    commercialMargin: 0,
    marginType: "fixed",
    discount: 0,
    discountType: "fixed",
  };


const BUDGET_TEMPLATES = {
    empty: DEFAULT_BUDGET,
    wordpress: {
      section: [
        {
          id: generateId(),
          name: "Design & UX",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "UI/UX Designer",
              type: "hourly",
              rate: 45
            },
            {
              id: generateId(),
              name: "Template Premium",
              type: "fixed",
              rate: 0
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "Wireframing & Mockups",
              resourceAllocations: {} // Will be populated with actual hours
            },
            {
              id: generateId(),
              name: "Template Customization",
              resourceAllocations: {}
            }
          ]
        },
        {
          id: generateId(),
          name: "Sviluppo",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "WordPress Developer",
              type: "hourly",
              rate: 50
            },
            {
              id: generateId(),
              name: "Plugin Premium",
              type: "fixed",
              rate: 0
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "Configurazione WordPress",
              resourceAllocations: {}
            },
            {
              id: generateId(),
              name: "Sviluppo Custom",
              resourceAllocations: {}
            }
          ]
        }
      ],
      commercialMargin: 20,
      marginType: "percentage",
      discount: 0,
      discountType: "fixed"
    } as BudgetData,
    event: {
      section: [
        {
          id: generateId(),
          name: "Pianificazione",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "Event Manager",
              type: "hourly",
              rate: 60
            },
            {
              id: generateId(),
              name: "Location",
              type: "fixed",
              rate: 0
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "Pianificazione Evento",
              resourceAllocations: {}
            },
            {
              id: generateId(),
              name: "Gestione Fornitori",
              resourceAllocations: {}
            }
          ]
        }
      ],
      commercialMargin: 15,
      marginType: "percentage",
      discount: 0,
      discountType: "fixed"
    } as BudgetData,
    mobile: {
      section: [
        {
          id: generateId(),
          name: "Design & UX",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "UI/UX Designer",
              type: "hourly",
              rate: 55
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "User Research",
              resourceAllocations: {}
            },
            {
              id: generateId(),
              name: "UI Design",
              resourceAllocations: {}
            }
          ]
        },
        {
          id: generateId(),
          name: "Sviluppo",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "Mobile Developer",
              type: "hourly",
              rate: 65
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "Sviluppo Frontend",
              resourceAllocations: {}
            },
            {
              id: generateId(),
              name: "Testing & Debug",
              resourceAllocations: {}
            }
          ]
        }
      ],
      commercialMargin: 25,
      marginType: "percentage",
      discount: 0,
      discountType: "fixed"
    } as BudgetData,
    architecture: {
      section: [
        {
          id: generateId(),
          name: "Progettazione",
          isExpanded: true,
          resources: [
            {
              id: generateId(),
              name: "Architetto Senior",
              type: "hourly",
              rate: 80
            },
            {
              id: generateId(),
              name: "Architetto Junior",
              type: "hourly",
              rate: 45
            }
          ],
          activities: [
            {
              id: generateId(),
              name: "Concept Design",
              resourceAllocations: {}
            },
            {
              id: generateId(),
              name: "Elaborati Tecnici",
              resourceAllocations: {}
            }
          ]
        }
      ],
      commercialMargin: 30,
      marginType: "percentage",
      discount: 0,
      discountType: "fixed"
    } as BudgetData
  };

  type TemplateType = keyof typeof BUDGET_TEMPLATES;





const DemoBudgetCalculator = () => {
  const [budget, setBudget] = useState<BudgetData>(DEFAULT_BUDGET);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("empty");


  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    });
  };

  const handleTemplateChange = (templateKey: TemplateType) => {
    setSelectedTemplate(templateKey);
    setBudget(BUDGET_TEMPLATES[templateKey]);
  };

  const calculateActivityCost = (activity: Activity, resources: Resource[]): number => {
    return resources.reduce((total, resource) => {
      const allocation = activity.resourceAllocations[resource.id] || 0;
      if (resource.type === "fixed") {
        return total + allocation;
      }
      return total + allocation * resource.rate;
    }, 0);
  };

  const calculateSectionTotal = (section: BudgetSection): number => {
    return section.activities.reduce(
      (total, activity) => total + calculateActivityCost(activity, section.resources),
      0
    );
  };

  const calculateTotal = () => {
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
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      ),
    }));
  };

  const addSection = () => {
    setBudget(prev => ({
      ...prev,
      section: [
        ...prev.section,
        {
          id: generateId(),
          name: "Nuova Sezione",
          isExpanded: false,
          activities: [],
          resources: [],
        },
      ],
    }));
  };

  const addActivity = (sectionId: string) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
              ...section,
              activities: [
                ...section.activities,
                {
                  id: generateId(),
                  name: "Nuova Attività",
                  resourceAllocations: {},
                },
              ],
            }
          : section
      ),
    }));
  };

  const addResource = (sectionId: string) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: [
                ...section.resources,
                {
                  id: generateId(),
                  name: "Nuova Risorsa",
                  type: "hourly",
                  rate: 0,
                },
              ],
            }
          : section
      ),
    }));
  };

  const updateResource = (
    sectionId: string,
    resourceId: string,
    updates: Partial<Resource>
  ) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: section.resources.map(resource =>
                resource.id === resourceId
                  ? { ...resource, ...updates }
                  : resource
              ),
            }
          : section
      ),
    }));
  };

  const updateActivity = (
    sectionId: string,
    activityId: string,
    updates: Partial<Activity> | { resourceId: string; allocation: number }
  ) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
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
            }
          : section
      ),
    }));
  };

  const deleteSection = (sectionId: string) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.filter(section => section.id !== sectionId),
    }));
  };

  const deleteActivity = (sectionId: string, activityId: string) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
              ...section,
              activities: section.activities.filter(
                activity => activity.id !== activityId
              ),
            }
          : section
      ),
    }));
  };

  const deleteResource = (sectionId: string, resourceId: string) => {
    setBudget(prev => ({
      ...prev,
      section: prev.section.map(section =>
        section.id === sectionId
          ? {
              ...section,
              resources: section.resources.filter(
                resource => resource.id !== resourceId
              ),
              activities: section.activities.map(activity => ({
                ...activity,
                resourceAllocations: Object.fromEntries(
                  Object.entries(activity.resourceAllocations).filter(
                    ([key]) => key !== resourceId
                  )
                ),
              })),
            }
          : section
      ),
    }));
  };

  return (
    <div className=" px-16 mb-4">
        {/* templates select */}
        <div className="mb-6">
            
            <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value as TemplateType)}
                className="w-full max-w-xs border rounded-md p-2"
            >
                <option value="empty">Template Vuoto</option>
                <option value="wordpress">Sito Web WordPress</option>
                <option value="event">Organizzazione Evento</option>
                <option value="mobile">App Mobile</option>
                <option value="architecture">Progetto Architetturale</option>
            </select>
            </div>


      <div className="space-y-4">
        {budget.section.map((section) => (
          <div key={section.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
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
                placeholder="inserisci nome della sezione qui"
                value={section.name}
                onChange={(e) => {
                  setBudget(prev => ({
                    ...prev,
                    section: prev.section.map(s =>
                      s.id === section.id ? { ...s, name: e.target.value } : s
                    ),
                  }));
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
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {section.isExpanded && (
              <div className="pl-6 space-y-4">
                {/* Resources */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex gap-1">
                    <ContactRound className="w-5 h-5" /> Risorse
                  </h3>
                  <div className="space-y-2">
                    {section.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center gap-2"
                      >
                        <Input
                          placeholder="Resource name"
                          value={resource.name}
                          onChange={(e) =>
                            updateResource(section.id, resource.id, {
                              name: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                        <select
                          value={resource.type}
                          onChange={(e) =>
                            updateResource(section.id, resource.id, {
                              type: e.target.value as Resource["type"],
                            })
                          }
                          className="border rounded p-2 text-sm"
                        >
                          <option value="hourly">Oraria</option>
                          <option value="quantity">Quantità</option>
                          <option value="fixed">Fisso</option>
                        </select>
                        
                        {resource.type !== "fixed" && (
                          <Input
                            type="number"
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
                      Aggiungi Risorsa
                    </Button>
                  </div>
                </div>

                {/* Activities Matrix */}
                <div className="space-y-2">
                  <div className="space-y-4">
                    <div
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `minmax(200px, 1fr) repeat(${section.resources.length}, minmax(100px, 1fr)) auto`,
                      }}
                    >
                      <div className="font-semibold flex gap-1">
                        <Hammer className="h-5 w-5" /> Attività
                      </div>
                      {section.resources.map((resource) => (
                        <div key={resource.id} className="text-center text-sm">
                          {resource.name}
                        </div>
                      ))}
                      <div />
                    </div>

                    {section.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="grid gap-4"
                        style={{
                          gridTemplateColumns: `minmax(200px, 1fr) repeat(${section.resources.length}, minmax(100px, 1fr)) auto`,
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
                            <Input
                              type="number"
                              value={activity.resourceAllocations[resource.id] || ""}
                              onChange={(e) =>
                                updateActivity(section.id, activity.id, {
                                  resourceId: resource.id,
                                  allocation: Number(e.target.value) || 0,
                                })
                              }
                              className="text-center"
                              placeholder={
                                resource.type === "hourly"
                                  ? "Hours"
                                  : resource.type === "quantity"
                                  ? "Quantity"
                                  : "Cost (€)"
                              }
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-2 font-semibold">
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
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addActivity(section.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Attività
                  </Button>
                </div>

                {/* Section Total */}
                <div className="pt-4 border-t">
                  <p className="text-base font-semibold">
                    Costo totale: {formatCurrency(calculateSectionTotal(section))}
                  </p>
                </div>
              </div>
            )}
            </div>
        ))}
        <Button variant="outline" onClick={addSection} >
          <Plus className="h-4 w-4 mr-1" />
          Aggiungi Sezione
        </Button>
      </div>

      {/* Commercial Margin */}
      <div className='mt-4'>
        <h2 className="text-base font-semibold mb-2">🤑 Margine Commerciale</h2>
        <RadioGroup
          value={budget.marginType}
          onValueChange={(value: "fixed" | "percentage") =>
            setBudget(prev => ({ ...prev, marginType: value }))
          }
          className="flex items-center space-x-4 mb-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="margin-fixed" />
            <Label htmlFor="margin-fixed">Fisso (€)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="margin-percentage" />
            <Label htmlFor="margin-percentage">Percentuale (%)</Label>
          </div>
        </RadioGroup>
        <Input
          type="number"
          value={budget.commercialMargin}
          onChange={(e) =>
            setBudget(prev => ({ ...prev, commercialMargin: Number(e.target.value) || 0 }))
          }
          className="max-w-xs"
        />
      </div>

      {/* Discount */}
      <div>
        <h2 className="text-base font-semibold my-2">🧐 Sconto</h2>
        <RadioGroup
          value={budget.discountType}
          onValueChange={(value: "fixed" | "percentage") =>
            setBudget(prev => ({ ...prev, discountType: value }))
          }
          className="flex items-center space-x-4 mb-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="discount-fixed" />
            <Label htmlFor="discount-fixed">Fisso (€)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="discount-percentage" />
            <Label htmlFor="discount-percentage">Percentuale (%)</Label>
          </div>
        </RadioGroup>
        <Input
          type="number"
          value={budget.discount}
          onChange={(e) =>
            setBudget(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))
          }
          className="max-w-xs"
        />
      </div>

      {/* Totals */}
      <div className="pt-4 rounded-lg bg-gray-900 text-white p-4 mt-4">
        <h2 className='text-xl mb-4 font-bold'> Totali</h2>
        <div className="space-y-2 text-base">
          {(() => {
            const totals = calculateTotal();
            return (
              <>
                <p className="text-gray-200">
                  Totale delle sezioni: {formatCurrency(totals.baseTotal)}
                </p>
                <p className="text-gray-200">
                  🤑 Margine Commerciale: {formatCurrency(totals.marginAmount)}
                </p>
                <p className="font-bold">
                  Totale con margine: {formatCurrency(totals.totalWithMargin)}
                </p>
                <p className="text-gray-200">
                  🧐 Sconto: {formatCurrency(totals.discountAmount)}
                </p>
                <p className="text-2xl font-bold">
                  🥳 Totale imponibile complessivo: {formatCurrency(totals.finalTotal)}
                </p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default DemoBudgetCalculator;