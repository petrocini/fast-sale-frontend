import * as React from "react";

import { cn } from "@/lib/utils";

export type TabsValue = string;

interface TabsProps {
  value: TabsValue;
  onValueChange: (value: TabsValue) => void;
  className?: string;
  children: React.ReactNode;
}

function Tabs({ value, onValueChange, className, children }: TabsProps) {
  return (
    <div className={cn("space-y-4", className)} data-tabs-value={value}>
      {/* Context via props + children composition */}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return React.cloneElement(child as any, { value, onValueChange });
      })}
    </div>
  );
}

interface TabsListProps {
  value?: TabsValue;
  onValueChange?: (value: TabsValue) => void;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

function TabsList({
  className,
  children,
  "aria-label": ariaLabel = "Seções",
}: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md border border-border bg-muted/30 p-1 text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: TabsValue;
  currentValue?: TabsValue;
  onValueChange?: (value: TabsValue) => void;
}

function TabsTrigger({
  value,
  currentValue,
  onValueChange,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const selected = currentValue === value;
  const tabId = `tab-${value}`;
  const panelId = `panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-controls={panelId}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/60 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: TabsValue;
  currentValue?: TabsValue;
  className?: string;
  children: React.ReactNode;
}

function TabsContent({ value, currentValue, className, children }: TabsContentProps) {
  const selected = currentValue === value;
  const panelId = `panel-${value}`;
  const tabId = `tab-${value}`;

  if (!selected) return null;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      className={cn("outline-none", className)}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

