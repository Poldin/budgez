'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Trash2, ArrowUp, ArrowDown, Plus, ChevronDown } from 'lucide-react';
import type { Activity, Resource, ActivityDiscount, ResourceAssignment } from '@/types/budget';
import { formatDateToLocal, formatNumber } from '@/lib/budget-utils';
import {
  calculateResourceCost,
  calculateActivityTotal,
  calculateActivityDiscountAmount,
  calculateActivityTotalWithVat
} from '@/lib/budget-calculations';

interface ActivityCardProps {
  activity: Activity;
  activityIndex: number;
  resources: Resource[];
  currency: string;
  defaultVat: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (id: string, field: keyof Activity, value: string | number | ActivityDiscount | undefined) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddResource: (activityId: string) => void;
  onUpdateResource: (activityId: string, index: number, field: keyof ResourceAssignment, value: string | number) => void;
  onRemoveResource: (activityId: string, index: number) => void;
  hideMargin?: boolean;
  translations: any;
}

export default function ActivityCard({
  activity,
  activityIndex,
  resources,
  currency,
  defaultVat,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddResource,
  onUpdateResource,
  onRemoveResource,
  hideMargin = false,
  translations: t
}: ActivityCardProps) {
  const activitySubtotal = calculateActivityTotal(resources, activity);
  const activityDiscountAmount = calculateActivityDiscountAmount(resources, activity);
  const activityTotalWithVat = calculateActivityTotalWithVat(resources, activity);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={onToggle}
          >
            <ChevronDown 
              className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
            <CardTitle className="text-xl">
              {activity.name || `${t.activityName} ${activityIndex + 1}`}
            </CardTitle>
            {!isExpanded && (
              <span className="text-lg font-bold ml-auto">
                {currency}{formatNumber(activityTotalWithVat)}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(activityIndex);
              }}
              disabled={activityIndex === 0}
              className="px-2"
              title="Sposta su"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(activityIndex);
              }}
              disabled={activityIndex === 0}
              className="px-2"
              title="Sposta giù"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(activity.id);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
              title="Elimina"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Nome Attività */}
          <div>
            <Label className="text-gray-500">{t.activityName}</Label>
            <Input
              value={activity.name}
              onChange={(e) => onUpdate(activity.id, 'name', e.target.value)}
              placeholder={t.activityName}
            />
          </div>

          {/* Descrizione */}
          <div>
            <Label className="text-gray-500">{t.activityDescription}</Label>
            <Textarea
              value={activity.description}
              onChange={(e) => onUpdate(activity.id, 'description', e.target.value)}
              placeholder={t.activityDescription}
              rows={2}
            />
          </div>

          {/* Date Attività */}
          <div>
            <Label className="text-gray-500">Periodo Attività</Label>
            <div className="max-w-md">
              <DateRangePicker
                value={{
                  from: activity.startDate ? new Date(activity.startDate) : undefined,
                  to: activity.endDate ? new Date(activity.endDate) : undefined,
                }}
                onChange={(range) => {
                  if (range.from) {
                    onUpdate(activity.id, 'startDate', formatDateToLocal(range.from));
                  }
                  if (range.to) {
                    onUpdate(activity.id, 'endDate', formatDateToLocal(range.to));
                  }
                }}
                placeholder="Seleziona periodo attività"
              />
            </div>
          </div>

          {/* Risorse Assegnate */}
          <div>
            <Label className="text-base font-semibold">{t.assignResources}</Label>
            <div className="space-y-3 mt-3">
              {activity.resources.map((assignment, index) => {
                const resource = resources.find(r => r.id === assignment.resourceId);
                return (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs text-gray-500">{t.selectResource}</Label>
                      <Select
                        value={assignment.resourceId}
                        onValueChange={(value) => onUpdateResource(activity.id, index, 'resourceId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectResource} />
                        </SelectTrigger>
                        <SelectContent>
                          {resources.map(r => {
                            const priceText = r.costType === 'hourly' 
                              ? `${currency}${r.pricePerHour}/h` 
                              : r.costType === 'quantity' 
                              ? `${currency}${r.pricePerHour}/u` 
                              : t.fixed;
                            const marginText = !hideMargin && r.margin && r.margin > 0 ? ` • ${r.margin}%` : '';
                            return (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({priceText}{marginText})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {resource && resource.costType === 'hourly' ? (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">{t.hours}</Label>
                        <NumberInput
                          value={assignment.hours}
                          onChange={(value) => onUpdateResource(activity.id, index, 'hours', value)}
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    ) : resource && resource.costType === 'quantity' ? (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">{t.quantity}</Label>
                        <NumberInput
                          value={assignment.hours}
                          onChange={(value) => onUpdateResource(activity.id, index, 'hours', value)}
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    ) : resource && resource.costType === 'fixed' ? (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">{t.fixedPrice} ({currency})</Label>
                        <NumberInput
                          value={assignment.fixedPrice}
                          onChange={(value) => onUpdateResource(activity.id, index, 'fixedPrice', value)}
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    ) : (
                      <div className="col-span-2"></div>
                    )}

                    <div className="col-span-3 text-right">
                      <Label className="text-xs text-gray-500">{t.subtotal}</Label>
                      <div className="text-lg font-bold">
                        {currency}{formatNumber(calculateResourceCost(resources, assignment.resourceId, assignment.hours, assignment.fixedPrice))}
                      </div>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveResource(activity.id, index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Button
                onClick={() => onAddResource(activity.id)}
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={resources.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.addResourceToActivity}
              </Button>
            </div>
          </div>

          {/* IVA Attività */}
          <div className="pt-3 border-t">
            <Label className="text-gray-500">{t.vatRate}</Label>
            <div className="max-w-24">
              <NumberInput
                value={activity.vat}
                onChange={(value) => onUpdate(activity.id, 'vat', value)}
                placeholder="22"
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Margine Attività - nascosto quando hideMargin è true */}
          {!hideMargin && (
            <div className="pt-3 border-t">
              <Label className="text-gray-500">{t.activityMargin}</Label>
              <div className="max-w-20">
                <NumberInput
                  value={activity.margin || 0}
                  onChange={(value) => onUpdate(activity.id, 'margin', value || 0)}
                  placeholder="0"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}

          {/* Sconto Attività - nascosto quando hideMargin è true */}
          {!hideMargin && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Switch
                  checked={activity.discount?.enabled || false}
                  onCheckedChange={(checked) => {
                    const newDiscount: ActivityDiscount = activity.discount || {
                      enabled: false,
                      type: 'percentage',
                      value: 0,
                      applyOn: 'taxable'
                    };
                    onUpdate(activity.id, 'discount', {
                      ...newDiscount,
                      enabled: checked
                    });
                  }}
                />
                <Label className="text-base font-semibold">{t.activityDiscount}</Label>
              </div>
              
              {activity.discount?.enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">{t.discountType}</Label>
                      <Select
                        value={activity.discount?.type || 'percentage'}
                        onValueChange={(value: 'percentage' | 'fixed') => {
                          const newDiscount = activity.discount || {
                            enabled: true,
                            type: 'percentage',
                            value: 0,
                            applyOn: 'taxable'
                          };
                          onUpdate(activity.id, 'discount', {
                            ...newDiscount,
                            type: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">{t.percentage}</SelectItem>
                          <SelectItem value="fixed">{t.fixedAmount}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-gray-500">
                        {activity.discount?.type === 'percentage' ? t.percentage : `${t.fixedAmount} (${currency})`}
                      </Label>
                      <NumberInput
                        value={activity.discount?.value || 0}
                        onChange={(value) => {
                          const newDiscount = activity.discount || {
                            enabled: true,
                            type: 'percentage',
                            value: 0,
                            applyOn: 'taxable'
                          };
                          onUpdate(activity.id, 'discount', {
                            ...newDiscount,
                            value
                          });
                        }}
                        placeholder="0"
                        min={0}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">{t.applyDiscountOn}</Label>
                      <Select
                        value={activity.discount?.applyOn || 'taxable'}
                        onValueChange={(value: 'taxable' | 'withVat') => {
                          const newDiscount = activity.discount || {
                            enabled: true,
                            type: 'percentage',
                            value: 0,
                            applyOn: 'taxable'
                          };
                          onUpdate(activity.id, 'discount', {
                            ...newDiscount,
                            applyOn: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="taxable">{t.taxableAmount}</SelectItem>
                          <SelectItem value="withVat">{t.totalWithVatAmount}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {activity.discount.value > 0 && (
                    <div className="bg-amber-50 p-2 rounded text-xs text-amber-800">
                      {t.discountAmount}: {currency}{formatNumber(activityDiscountAmount)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Totale Attività */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-end items-center gap-2 text-sm">
              <span className="font-semibold">{t.subtotal}:</span>
              <span className="font-bold">
                {currency}{formatNumber(activitySubtotal)}
              </span>
            </div>
            {activity.discount?.enabled && activity.discount.value > 0 && (
              <div className="flex justify-end items-center gap-2 text-sm text-amber-600">
                <span>{t.discount}:</span>
                <span>
                  -{currency}{formatNumber(activityDiscountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-end items-center gap-2 text-sm text-gray-600">
              <span>{t.vat} ({activity.vat}%):</span>
              <span>
                {currency}{formatNumber(activitySubtotal * activity.vat / 100)}
              </span>
            </div>
            <div className="flex justify-end items-center gap-2 pt-2 border-t">
              <span className="font-semibold text-lg">{t.total}:</span>
              <span className="text-2xl font-bold">
                {currency}{formatNumber(activityTotalWithVat)}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

