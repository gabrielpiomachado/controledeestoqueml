import { useState, useMemo } from "react";
import { useInventory } from "@/contexts/InventoryContext";
import { MARKETPLACES } from "@/types/inventory";
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
import { AlertCircle } from "lucide-react";

interface SaleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleForm({ open, onOpenChange }: SaleFormProps) {
  const { products, addSale } = useInventory();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    marketplace: "",
    sku: "",
    quantity: "",
    salePrice: "",
    platformFee: "",
    shipping: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stockError, setStockError] = useState<string | null>(null);

  const selectedProduct = products.find(p => p.sku === formData.sku);

  // Calculate preview
  const preview = useMemo(() => {
    if (!selectedProduct || !formData.salePrice || !formData.quantity) {
      return null;
    }

    const quantity = parseInt(formData.quantity) || 0;
    const salePrice = parseFloat(formData.salePrice) || 0;
    const platformFee = parseFloat(formData.platformFee) || 0;
    const shipping = parseFloat(formData.shipping) || 0;
    const cost = selectedProduct.cost;

    const netProfit = (salePrice - cost) * quantity - platformFee - shipping;
    const totalRevenue = salePrice * quantity;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      netProfit,
      margin,
      hasStock: selectedProduct.stock >= quantity,
    };
  }, [selectedProduct, formData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = "Data é obrigatória";
    }
    
    if (!formData.marketplace) {
      newErrors.marketplace = "Selecione um marketplace";
    }
    
    if (!formData.sku) {
      newErrors.sku = "Selecione um produto";
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "Quantidade deve ser maior que zero";
    }
    
    if (!formData.salePrice || parseFloat(formData.salePrice) <= 0) {
      newErrors.salePrice = "Preço deve ser maior que zero";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockError(null);
    
    if (!validate()) return;

    // Parse date parts to avoid timezone issues
    const [year, month, day] = formData.date.split('-').map(Number);
    const result = addSale({
      date: new Date(year, month - 1, day),
      marketplace: formData.marketplace,
      sku: formData.sku,
      quantity: parseInt(formData.quantity),
      salePrice: parseFloat(formData.salePrice),
      platformFee: parseFloat(formData.platformFee) || 0,
      shipping: parseFloat(formData.shipping) || 0,
    });

    if (result.success) {
      onOpenChange(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        marketplace: "",
        sku: "",
        quantity: "",
        salePrice: "",
        platformFee: "",
        shipping: "",
      });
      setErrors({});
    } else {
      setStockError(result.error || "Erro ao registrar venda");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    setStockError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
        </DialogHeader>
        
        {stockError && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {stockError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="form-section">
          <div className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="marketplace" className="flex items-center gap-1">
                Marketplace <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.marketplace}
                onValueChange={(value) => handleChange("marketplace", value)}
              >
                <SelectTrigger className={errors.marketplace ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MARKETPLACES.map((mp) => (
                    <SelectItem key={mp} value={mp}>
                      {mp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.marketplace && (
                <p className="text-xs text-destructive">{errors.marketplace}</p>
              )}
            </div>
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
                    {product.sku} - Estoque: {product.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku}</p>
            )}
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                Custo: R$ {selectedProduct.cost.toFixed(2)} | Estoque: {selectedProduct.stock}
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
              <Label htmlFor="salePrice" className="flex items-center gap-1">
                Preço de Venda <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => handleChange("salePrice", e.target.value)}
                  placeholder="0,00"
                  className={`pl-10 ${errors.salePrice ? "border-destructive" : ""}`}
                />
              </div>
              {errors.salePrice && (
                <p className="text-xs text-destructive">{errors.salePrice}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platformFee">Taxa da Plataforma</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="platformFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.platformFee}
                  onChange={(e) => handleChange("platformFee", e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping">Frete</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="shipping"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping}
                  onChange={(e) => handleChange("shipping", e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Prévia do cálculo</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-lg font-semibold ${preview.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    R$ {preview.netProfit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margem</p>
                  <p className={`text-lg font-semibold ${preview.margin >= 0 ? "text-success" : "text-destructive"}`}>
                    {preview.margin.toFixed(1)}%
                  </p>
                </div>
              </div>
              {!preview.hasStock && (
                <p className="mt-2 text-xs text-destructive">
                  ⚠️ Estoque insuficiente para esta quantidade
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Registrar Venda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
