import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min, max, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value.toString());

    // Sincronizza displayValue quando value cambia dall'esterno
    React.useEffect(() => {
      setDisplayValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Permetti solo numeri, punto decimale, virgola e segno meno
      // Sostituisci virgola con punto per i numeri decimali
      const sanitized = inputValue.replace(/,/g, '.');
      
      // Permetti stringa vuota, numeri, un solo punto decimale e segno meno all'inizio
      if (sanitized === '' || sanitized === '-' || /^-?\d*\.?\d*$/.test(sanitized)) {
        setDisplayValue(inputValue);
        
        // Converti in numero solo se è un numero valido
        if (sanitized === '' || sanitized === '.' || sanitized === '-') {
          onChange(0);
        } else {
          const numValue = parseFloat(sanitized);
          if (!isNaN(numValue)) {
            // Applica min/max se specificati
            let finalValue = numValue;
            if (min !== undefined && numValue < min) finalValue = min;
            if (max !== undefined && numValue > max) finalValue = max;
            onChange(finalValue);
          }
        }
      }
    };

    const handleBlur = () => {
      // Formatta il numero quando l'utente esce dal campo
      const numValue = parseFloat(displayValue.replace(/,/g, '.'));
      if (!isNaN(numValue)) {
        setDisplayValue(numValue.toString());
      } else {
        setDisplayValue('0');
        onChange(0);
      }
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }

