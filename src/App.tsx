import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { InventoryProvider } from "@/contexts/InventoryContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import StockEntries from "./pages/StockEntries";
import Sales from "./pages/Sales";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InventoryProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/entradas" element={<StockEntries />} />
              <Route path="/vendas" element={<Sales />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </InventoryProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
