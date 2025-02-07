import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';

type BudgetResourceType = 'hourly' | 'quantity' | 'fixed';

interface DatabaseResource {
  id: number;  
  name: string;
  type: string;
  quantity: number;
}

interface ResourceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onResourceSelect: (resource: {
    name: string;
    type: BudgetResourceType;
    rate: number;
  }) => void;
  className?: string;
}

const mapDatabaseTypeToBudgetType = (dbType: string): BudgetResourceType => {
  const typeMap: { [key: string]: BudgetResourceType } = {
    'hourly': 'hourly',
    'hour': 'hourly',
    'hours': 'hourly',
    'quantity': 'quantity',
    'qty': 'quantity',
    'fixed': 'fixed',
    'fixed_cost': 'fixed',
  };

  const normalizedType = dbType?.toLowerCase().trim() || '';
  return typeMap[normalizedType] || 'hourly';
};

// Funzione per formattare la quantity in base al tipo
const formatQuantity = (quantity: number, type: string): string => {
  const budgetType = mapDatabaseTypeToBudgetType(type);
  switch (budgetType) {
    case 'hourly':
      return `${quantity}€/h`;
    case 'quantity':
      return `${quantity}€/u`;
    case 'fixed':
      return `${quantity}€`;
    default:
      return `${quantity}€`;
  }
};

const ResourceAutocomplete: React.FC<ResourceAutocompleteProps> = ({
  value,
  onChange,
  onResourceSelect,
  className
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [resources, setResources] = useState<DatabaseResource[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResources = async (searchTerm: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('database_resources')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('user_id', user.id)
        .limit(5);

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error in searchResources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (value.trim()) {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = setTimeout(() => {
        searchResources(value);
      }, 300);
    } else {
      setResources([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [value]);

  const handleSelect = (resource: DatabaseResource) => {
    const budgetType = mapDatabaseTypeToBudgetType(resource.type);
    
    const budgetResource = {
      name: resource.name,
      type: budgetType,
      rate: resource.quantity || 0,
    };

    onChange(resource.name);
    onResourceSelect(budgetResource);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        className={className}
        placeholder="Resource name"
        onFocus={() => setShowDropdown(true)}
      />
      
      {showDropdown && (resources.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="py-1">
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
            ) : resources.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
            ) : (
              resources.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleSelect(resource)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  
                  <span className="flex-1">{resource.name}</span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>{mapDatabaseTypeToBudgetType(resource.type)}</span>
                    <span className="font-medium">
                      {formatQuantity(resource.quantity || 0, resource.type)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceAutocomplete;