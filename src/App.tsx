import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";

function App() {
  // Recupera dados do usuário do localStorage para exibir "Olá, Lucas"
  const user = JSON.parse(localStorage.getItem("@fastsale:user") || "{}");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Frente de Caixa</h1>
          <p className="text-muted-foreground">
            Operador:{" "}
            <span className="text-foreground font-medium">
              {user.name || "Desconhecido"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de Evento (Futuramente será dinâmico) */}
          <div className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-md font-medium text-sm flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider opacity-70">
              EVENTO ATUAL
            </span>
            <span className="leading-tight">Nenhum Selecionado</span>
          </div>
        </div>
      </div>

      {/* Área Principal (Grid do PDV) */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Coluna Esquerda: Lista de Produtos (8 colunas) */}
        <div className="col-span-8 flex flex-col gap-4">
          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome ou código (F2)..."
              className="pl-10 h-12 text-lg shadow-sm border-muted-foreground/20"
              autoFocus
            />
          </div>

          {/* Grid de Produtos (Scrollável) */}
          <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 pb-2 content-start">
            {/* Placeholders Visuais */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all bg-card shadow-sm group"
              >
                <CardHeader className="p-4 pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary">
                    Churros Gourmet Exemplo {i}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-xl font-bold text-foreground">R$ 12,00</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estoque: 50
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Carrinho (4 colunas) */}
        <Card className="col-span-4 flex flex-col h-full border-muted-foreground/20 shadow-lg bg-card overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Cesta de Compras
            </CardTitle>
          </CardHeader>

          {/* Área Vazia do Carrinho */}
          <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <div className="bg-muted/50 p-6 rounded-full">
              <PlusCircle className="w-10 h-10 opacity-20" />
            </div>
            <p className="font-medium">Cesta vazia</p>
            <p className="text-sm opacity-60">Adicione itens para começar</p>
          </CardContent>

          {/* Footer do Carrinho (Totais) */}
          <div className="p-6 bg-muted/10 border-t border-border space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-muted-foreground font-medium">
                Total a pagar
              </span>
              <span className="text-4xl font-bold text-primary tracking-tight">
                R$ 0,00
              </span>
            </div>
            <Button
              size="lg"
              className="w-full text-lg font-bold h-14 uppercase tracking-wide shadow-primary/20 shadow-lg"
            >
              Finalizar Venda (F12)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;
