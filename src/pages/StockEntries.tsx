import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { StockEntryForm } from "@/components/stock/StockEntryForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ArrowDownToLine } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StockEntries() {
  const { stockEntries, products } = useInventory();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const sortedEntries = [...stockEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredEntries = sortedEntries.filter((entry) =>
    entry.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getProductCategory = (sku: string) => {
    const product = products.find((p) => p.sku === sku);
    return product?.category || "-";
  };

  return (
    <MainLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Entradas de Estoque</h1>
          <p className="page-subtitle">{stockEntries.length} entradas registradas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrada
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ArrowDownToLine className="h-8 w-8" />
                      <p>{search ? "Nenhuma entrada encontrada" : "Nenhuma entrada registrada"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{entry.sku}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {getProductCategory(entry.sku)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                        +{entry.quantity}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Dialog */}
      <StockEntryForm open={formOpen} onOpenChange={setFormOpen} />
    </MainLayout>
  );
}
