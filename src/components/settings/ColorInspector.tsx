import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ColorInspectorProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

export const ColorInspector = ({ 
  label, 
  value, 
  onChange, 
  className 
}: ColorInspectorProps) => {
  const [hexValue, setHexValue] = useState(value);
  const [isValidHex, setIsValidHex] = useState(true);

  // Update local state when prop changes
  useEffect(() => {
    setHexValue(value);
  }, [value]);

  // Validate hex color
  const validateHex = (hex: string): boolean => {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(hex);
  };

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setHexValue(inputValue);
    
    // Add # if user didn't include it
    const formattedValue = inputValue.startsWith('#') ? inputValue : `#${inputValue}`;
    
    if (validateHex(formattedValue)) {
      setIsValidHex(true);
      onChange(formattedValue);
    } else {
      setIsValidHex(false);
    }
  };

  // Handle color picker change
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const colorValue = e.target.value;
    setHexValue(colorValue);
    setIsValidHex(true);
    onChange(colorValue);
  };

  // Handle input blur - format the value
  const handleBlur = () => {
    if (hexValue && !hexValue.startsWith('#')) {
      const formattedValue = `#${hexValue}`;
      setHexValue(formattedValue);
      if (validateHex(formattedValue)) {
        setIsValidHex(true);
        onChange(formattedValue);
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <Card className="p-4 space-y-4">
        {/* Color Preview */}
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded border-2 border-border shadow-sm"
            style={{ 
              backgroundColor: isValidHex ? value : '#ff0000',
              borderColor: isValidHex ? value : '#ff0000'
            }}
          />
          <div className="flex-1">
            <div className="text-sm font-mono text-muted-foreground">
              {value}
            </div>
            {!isValidHex && (
              <div className="text-xs text-destructive">
                Invalid hex color
              </div>
            )}
          </div>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color Picker</Label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={isValidHex ? value : '#000000'}
              onChange={handleColorPickerChange}
              className="w-12 h-8 rounded border border-input cursor-pointer"
            />
            <Input
              type="text"
              value={hexValue}
              onChange={handleHexChange}
              onBlur={handleBlur}
              placeholder="#000000"
              className={`font-mono text-sm ${!isValidHex ? 'border-destructive' : ''}`}
            />
          </div>
        </div>

        {/* Quick Color Presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Colors</Label>
          <div className="grid grid-cols-8 gap-2">
            {[
              '#000000', '#ffffff', '#ff0000', '#00ff00', 
              '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
              '#ffa500', '#800080', '#008000', '#808080',
              '#ffc0cb', '#a52a2a', '#000080', '#808000'
            ].map((color) => (
              <button
                key={color}
                onClick={() => {
                  setHexValue(color);
                  setIsValidHex(true);
                  onChange(color);
                }}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
