import { useEffect } from "react";
import { useApp } from "@/contexts";

export const useTransparency = () => {
  const { customizable } = useApp();

  useEffect(() => {
    const updateTransparencyStyles = () => {
      const root = document.documentElement;
      
      
      if (customizable?.transparency?.isEnabled) {
        // Apply transparency
        root.style.setProperty('--window-opacity', (customizable?.transparency?.opacity ?? 0.8).toString());
        root.style.setProperty('--card-opacity', Math.min((customizable?.transparency?.opacity ?? 0.8) + 0.1, 1).toString());
        root.style.setProperty('--overlay-opacity', Math.max((customizable?.transparency?.opacity ?? 0.8) - 0.2, 0.3).toString());
        
        // Add transparency classes to main elements
        const mainCard = document.querySelector('[data-slot="card"]');
        if (mainCard) {
          mainCard.classList.add('transparent-card');
        }
        
        // Apply to body for window transparency
        document.body.classList.add('transparent-window');
      } else {
        // Remove transparency
        root.style.setProperty('--window-opacity', '1');
        root.style.setProperty('--card-opacity', '1');
        root.style.setProperty('--overlay-opacity', '1');
        
        // Remove transparency classes
        const mainCard = document.querySelector('[data-slot="card"]');
        if (mainCard) {
          mainCard.classList.remove('transparent-card');
        }
        
        document.body.classList.remove('transparent-window');
      }

      // Apply popover trigger transparency variables
      if (customizable?.popoverTrigger?.isEnabled) {
        const value = Math.min(1, Math.max(0, customizable?.popoverTrigger?.opacity ?? 0.25));
        root.style.setProperty('--popover-trigger-bg', `oklch(from var(--background) l c h / ${value})`);
        root.style.setProperty('--popover-trigger-blur', 'blur(12px)');
        root.style.setProperty('--popover-trigger-icon-color', '#ffffff');
      } else {
        root.style.removeProperty('--popover-trigger-bg');
        root.style.removeProperty('--popover-trigger-blur');
        root.style.removeProperty('--popover-trigger-icon-color');
      }
    };

    updateTransparencyStyles();
  }, [customizable?.transparency?.isEnabled, customizable?.transparency?.opacity, customizable?.popoverTrigger?.isEnabled, customizable?.popoverTrigger?.opacity]);

  return {
    isTransparencyEnabled: customizable?.transparency?.isEnabled ?? true,
    opacity: customizable?.transparency?.opacity ?? 0.8,
  };
};
