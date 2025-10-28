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
  const [open, setOpen] = React.useState(false);
  const dateRef = React.useRef<DateRange | undefined>(date);

  // Aggiorna il ref ogni volta che date cambia
  React.useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    dateRef.current = range; // Aggiorna immediatamente il ref
    
    if (onChange && range) {
      onChange({
        from: range.from,
        to: range.to,
      });
    }
    
    // Se abbiamo solo la prima data, assicurati che il popover rimanga aperto
    if (range?.from && !range?.to) {
      setOpen(true);
    }
    
    // Chiudi SOLO se entrambe le date sono state selezionate
    if (range?.from && range?.to) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Usa il ref per avere i valori più aggiornati
    const currentDate = dateRef.current;
    
    // Se sta cercando di chiudere ma abbiamo solo una data, riapri immediatamente
    if (!newOpen && currentDate?.from && !currentDate?.to) {
      setTimeout(() => setOpen(true), 0);
      return;
    }
    setOpen(newOpen);
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
      <Popover open={open} onOpenChange={handleOpenChange}>
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
        <PopoverContent 
          className="w-auto p-0" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
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

