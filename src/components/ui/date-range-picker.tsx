"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: {
    from?: Date;
    to?: Date;
  };
  onChange?: (range: { from?: Date; to?: Date }) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Seleziona un intervallo"
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: value?.from,
    to: value?.to,
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (onChange && range) {
      onChange({
        from: range.from,
        to: range.to,
      });
    }
  };

  // Formatta il testo da mostrare nel pulsante
  const formatDateRange = () => {
    if (!date?.from) {
      return <span className="text-gray-500">{placeholder}</span>;
    }
    
    if (!date.to) {
      return date.from.toLocaleDateString('it-IT');
    }
    
    return `${date.from.toLocaleDateString('it-IT')} - ${date.to.toLocaleDateString('it-IT')}`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

