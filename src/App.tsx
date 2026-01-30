import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PlusCircle,
  Search,
  Loader2,
  ShoppingCart,
  Trash2,
  PackageOpen,
} from "lucide-react";

import { api } from "@/api/axios";
import { Product, SelectedAddon } from "@/types";
import { useCartStore } from "@/stores/cart-store";
import { useEventStore } from "@/stores/event-store";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EventSelector } from "@/components/pos/event-selector";
import { ProductAddonModal } from "@/components/pos/product-addon-modal";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const { currentEvent, userChoseNoEvent, openEventSelector } = useEventStore();

  // Controle do Modal de Adicionais
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // Stores
  const { items, addItem, removeItem, totalAmount, clearCart } = useCartStore();
  const cartTotal = totalAmount();
  const user = JSON.parse(localStorage.getItem("@fastsale:user") || "{}");

  // API
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get("/products");
      return response.data;
    },
    enabled: true,
  });

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handler: Início da adição
  const handleProductClick = (product: Product) => {
    // Verifica se tem adicionais configurados
    if (product.addon_configs && product.addon_configs.length > 0) {
      setSelectedProduct(product);
      setIsAddonModalOpen(true);
    } else {
      // Fluxo Rápido: Adiciona 1 direto
      addItem(product, 1);
    }
  };

  // Handler: Confirmação do Modal
  const handleConfirmAddon = (
    product: Product,
    quantity: number,
    addons: SelectedAddon[],
  ) => {
    addItem(product, quantity, addons);
    setIsAddonModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <EventSelector />

      {/* Modal de Adicionais */}
      <ProductAddonModal
        product={selectedProduct}
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
        onConfirm={handleConfirmAddon}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Frente de Caixa</h1>
          <p className="text-muted-foreground text-sm">
            Operador:{" "}
            <span className="text-foreground font-medium">{user.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openEventSelector}
            className="group bg-card border border-border px-4 py-2 rounded-md font-medium text-sm flex flex-col items-end shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-colors text-right"
          >
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              EVENTO ATUAL
            </span>
            <div className="flex items-center gap-2">
              <span className="leading-tight text-primary font-bold">
                {currentEvent
                  ? currentEvent.name
                  : userChoseNoEvent
                    ? "Sem evento"
                    : "Selecione ou continue sem evento"}
              </span>
              {currentEvent && (
                <span className="text-xs text-muted-foreground group-hover:text-destructive underline ml-1">
                  (Trocar)
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* CATÁLOGO */}
        <div className="col-span-8 flex flex-col gap-4 h-full">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produto (F2)..."
              className="pl-10 h-12 text-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-2 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 auto-rows-max">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="cursor-pointer hover:border-primary hover:bg-primary/5 transition-all bg-card shadow-sm group border-l-4 border-l-transparent hover:border-l-primary active:scale-95 duration-75 relative"
                  >
                    <CardHeader className="p-4 pb-2 space-y-0">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary line-clamp-2">
                          {product.name}
                        </CardTitle>
                        {product.addon_configs &&
                          product.addon_configs.length > 0 && (
                            <span className="bg-accent/20 text-accent text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                              OPÇÕES
                            </span>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(Number(product.price))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Estoque: {product.stock_qty}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <PackageOpen className="h-12 w-12 mb-2" />
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* CARRINHO */}
        <Card className="col-span-4 flex flex-col h-full border-muted-foreground/20 shadow-xl bg-card overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/10 py-4 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Cesta de Compras
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
                <div className="bg-muted/50 p-6 rounded-full">
                  <PlusCircle className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-medium">Cesta vazia</p>
                <p className="text-sm opacity-60 text-center">
                  Selecione produtos ao lado para iniciar a venda
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div
                    key={item.internalId}
                    className="p-4 hover:bg-accent/5 transition-colors flex justify-between group"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity}x{" "}
                        {formatCurrency(Number(item.product.price))}
                      </div>
                      {item.selectedAddons.length > 0 && (
                        <div className="text-xs text-accent mt-1 pl-2 border-l-2 border-accent/30 space-y-0.5">
                          {item.selectedAddons.map((a, idx) => (
                            <div
                              key={`${item.internalId}-addon-${idx}`}
                              className="flex justify-between w-32"
                            >
                              <span>+ {a.name}</span>
                              <span>
                                {Number(a.price) > 0
                                  ? formatCurrency(a.price)
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <span className="font-bold">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <button
                        onClick={() => removeItem(item.internalId)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Footer Carrinho */}
          <div className="p-6 bg-muted/10 border-t border-border space-y-4 shrink-0">
            <div className="flex justify-between items-end">
              <span className="text-muted-foreground font-medium">
                Total a pagar
              </span>
              <span className="text-4xl font-bold text-primary tracking-tight">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="col-span-1 border-destructive/30 hover:bg-destructive hover:text-white"
                onClick={clearCart}
                disabled={items.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                className="col-span-3 text-lg font-bold h-12 uppercase tracking-wide shadow-lg shadow-primary/20"
                disabled={items.length === 0}
                // TODO: Adicionar onClick={() => setIsCheckoutOpen(true)}
              >
                Finalizar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
