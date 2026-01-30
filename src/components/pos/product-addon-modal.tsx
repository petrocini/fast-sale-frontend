import { useEffect, useState } from "react";
import { Check, Plus, Minus } from "lucide-react";

import { Product, SelectedAddon, AddonItem } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Vamos usar badge simples, se não tiver pode remover
import { ScrollArea } from "@/components/ui/scroll-area"; // Se não tiver scroll-area, pode usar div overflow-y-auto

// Badge Simples caso não tenha o componente
function SimpleBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("px-2 py-0.5 rounded-full text-xs font-bold", className)}
    >
      {children}
    </span>
  );
}

interface ProductAddonModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    product: Product,
    quantity: number,
    addons: SelectedAddon[],
  ) => void;
}

export function ProductAddonModal({
  product,
  isOpen,
  onClose,
  onConfirm,
}: ProductAddonModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<number, number[]>>({}); // group_id -> [addon_item_id]

  // Resetar estado ao abrir novo produto
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelections({});
    }
  }, [isOpen, product]);

  if (!product) return null;

  // Helpers de seleção
  const toggleSelection = (groupId: number, itemId: number, max: number) => {
    setSelections((prev) => {
      const groupSelections = prev[groupId] || [];
      const isSelected = groupSelections.includes(itemId);

      if (isSelected) {
        // Remover
        return {
          ...prev,
          [groupId]: groupSelections.filter((id) => id !== itemId),
        };
      } else {
        // Adicionar (respeitando max)
        if (groupSelections.length >= max && max > 1) {
          // Se for multipla escolha mas chegou no limite, não faz nada (ou poderia substituir o mais antigo)
          return prev;
        }
        if (max === 1) {
          // Se for escolha única, substitui
          return { ...prev, [groupId]: [itemId] };
        }
        return { ...prev, [groupId]: [...groupSelections, itemId] };
      }
    });
  };

  // Cálculos
  const basePrice = Number(product.price);

  // Buscar objetos completos dos addons selecionados
  const selectedAddonsDetails: SelectedAddon[] = [];
  let addonsTotal = 0;

  product.addon_configs?.forEach((config) => {
    const selectedIds = selections[config.group_id] || [];
    selectedIds.forEach((id) => {
      const item = config.group.items.find((i) => i.id === id);
      if (item) {
        selectedAddonsDetails.push({
          id: item.id,
          name: item.name,
          price: Number(item.price),
        });
        addonsTotal += Number(item.price);
      }
    });
  });

  const unitTotal = basePrice + addonsTotal;
  const finalTotal = unitTotal * quantity;

  // Validação: Todos os grupos com min > 0 foram satisfeitos?
  const isValid =
    product.addon_configs?.every((config) => {
      const selectedCount = (selections[config.group_id] || []).length;
      return selectedCount >= config.min_selection;
    }) ?? true;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-card">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl flex items-center justify-between">
            {product.name}
            <span className="text-primary text-2xl font-bold">
              {formatCurrency(unitTotal)}
            </span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Personalize seu item abaixo
          </DialogDescription>
        </DialogHeader>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {product.addon_configs?.map((config) => {
            const currentSelected = selections[config.group_id] || [];
            const reachedMax = currentSelected.length >= config.max_selection;
            const satisfiedMin = currentSelected.length >= config.min_selection;

            return (
              <div key={config.id} className="space-y-3">
                <div className="flex items-center justify-between sticky top-0 bg-card z-10 py-2 border-b border-border/50">
                  <div>
                    <h4 className="font-bold text-lg">{config.group.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {config.min_selection > 0
                        ? `Escolha de ${config.min_selection} a ${config.max_selection}`
                        : `Opcional (Máx ${config.max_selection})`}
                    </p>
                  </div>
                  <SimpleBadge
                    className={cn(
                      "transition-colors",
                      satisfiedMin
                        ? "bg-emerald-500/20 text-emerald-500"
                        : "bg-amber-500/20 text-amber-500",
                    )}
                  >
                    {satisfiedMin ? "OK" : "Obrigatório"}
                  </SimpleBadge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.group.items.map((item) => {
                    const isSelected = currentSelected.includes(item.id);
                    const isDisabled =
                      !isSelected && reachedMax && config.max_selection > 1;
                    // Se for max 1, nunca desabilita, apenas troca

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          !!item.is_available &&
                          toggleSelection(
                            config.group_id,
                            item.id,
                            config.max_selection,
                          )
                        }
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all hover:bg-accent/5",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border",
                          !item.is_available &&
                            "opacity-50 cursor-not-allowed bg-muted",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {Number(item.price) > 0
                            ? `+ ${formatCurrency(Number(item.price))}`
                            : "Grátis"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer com Quantidade e Botão */}
        <div className="p-6 border-t border-border bg-muted/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 bg-background border border-border rounded-md p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-bold text-lg">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Final</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(finalTotal)}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-12"
            disabled={!isValid}
            onClick={() => onConfirm(product, quantity, selectedAddonsDetails)}
          >
            Confirmar e Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
