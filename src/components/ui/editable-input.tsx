import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableInputProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: "text" | "number" | "currency";
  className?: string;
  displayClassName?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function EditableInput({
  value,
  onSave,
  type = "text",
  className,
  displayClassName,
  placeholder,
  min,
  max
}: EditableInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let processedValue: string | number = editValue;
      
      if (type === "number" || type === "currency") {
        const numValue = parseFloat(editValue);
        if (isNaN(numValue)) {
          setEditValue(String(value));
          setIsEditing(false);
          setIsLoading(false);
          return;
        }
        if (min !== undefined && numValue < min) {
          setEditValue(String(value));
          setIsEditing(false);
          setIsLoading(false);
          return;
        }
        if (max !== undefined && numValue > max) {
          setEditValue(String(value));
          setIsEditing(false);
          setIsLoading(false);
          return;
        }
        processedValue = numValue;
      }

      await onSave(processedValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(String(value));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const formatDisplayValue = () => {
    if (type === "currency" && typeof value === "number") {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    if (type === "number" && typeof value === "number") {
      return new Intl.NumberFormat('pt-BR').format(value);
    }
    return String(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type={type === "currency" || type === "number" ? "number" : "text"}
          min={min}
          max={max}
          step={type === "currency" ? "0.01" : "1"}
          placeholder={placeholder}
          className={cn("h-8", className)}
          autoFocus
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 transition-colors",
        displayClassName
      )}
      onClick={() => setIsEditing(true)}
    >
      <span>{formatDisplayValue()}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </div>
  );
}