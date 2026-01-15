import { useState } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StockEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedSku?: string;
}

export function StockEntryForm({ open, onOpenChange, preselectedSku }: StockEntryFormProps) {
  const { products, addStockEntry } = useInventory();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    sku: preselectedSku || "",
    quantity: "",
    cost: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = "Data é obrigatória";
    }
    
    if (!formData.sku) {
      newErrors.sku = "Selecione um produto";
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que zero";
    }

    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      newErrors.cost = "Custo deve ser maior que zero";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    // Parse date parts to avoid timezone issues
    const [year, month, day] = formData.date.split('-').map(Number);
    const success = addStockEntry({
      date: new Date(year, month - 1, day),
      sku: formData.sku,
      quantity: parseInt(formData.quantity),
      cost: parseFloat(formData.cost),
    });

    if (success) {
      onOpenChange(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        sku: "",
        quantity: "",
        cost: "",
      });
      setErrors({});
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectedProduct = products.find(p => p.sku === formData.sku);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Estoque</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="form-section">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku" className="flex items-center gap-1">
              Produto <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.sku}
              onValueChange={(value) => handleChange("sku", value)}
            >
              <SelectTrigger className={errors.sku ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.sku}>
                    {product.sku} - {product.category || "Sem categoria"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku}</p>
            )}
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Estoque atual: {selectedProduct.stock} unidades
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="flex items-center gap-1">
                Quantidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="0"
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && (
                <p className="text-xs text-destructive">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost" className="flex items-center gap-1">
                Custo Unitário <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleChange("cost", e.target.value)}
                  placeholder="0,00"
                  className={`pl-10 ${errors.cost ? "border-destructive" : ""}`}
                />
              </div>
              {errors.cost && (
                <p className="text-xs text-destructive">{errors.cost}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Entrada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
