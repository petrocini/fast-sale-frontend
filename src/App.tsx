import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";

function App() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-primary">Fast Sale PDV</h1>
      <p className="text-muted-foreground">Sistema pronto para iniciar.</p>

      <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-emerald-700 transition">
        <ScanBarcode />
        Iniciar Venda
      </button>
    </div>
  );
}

export default App;
