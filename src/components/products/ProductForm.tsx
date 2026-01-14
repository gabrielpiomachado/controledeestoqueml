import { useState, useEffect } from "react";
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
import { Product } from "@/types/inventory";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: Product;
}

export function ProductForm({ open, onOpenChange, editProduct }: ProductFormProps) {
  const { addProduct, updateProduct } = useInventory();
  const [formData, setFormData] = useState({
    sku: "",
    ean: "",
    category: "",
    cost: "",
    link: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when editProduct changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        sku: editProduct?.sku || "",
        ean: editProduct?.ean || "",
        category: editProduct?.category || "",
        cost: editProduct?.cost?.toString() || "",
        link: editProduct?.link || "",
      });
      setErrors({});
    }
  }, [open, editProduct]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.sku.trim()) {
      newErrors.sku = "SKU é obrigatório";
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

    const productData = {
      sku: formData.sku.trim(),
      ean: formData.ean.trim(),
      category: formData.category.trim(),
      cost: parseFloat(formData.cost),
      link: formData.link.trim(),
    };

    let success: boolean;
    if (editProduct) {
      success = updateProduct(editProduct.id, productData);
    } else {
      success = addProduct(productData);
    }

    if (success) {
      onOpenChange(false);
      setFormData({ sku: "", ean: "", category: "", cost: "", link: "" });
      setErrors({});
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editProduct ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="form-section">
          <div className="space-y-2">
            <Label htmlFor="sku" className="flex items-center gap-1">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="Ex: PROD-001"
              disabled={!!editProduct}
              className={errors.sku ? "border-destructive" : ""}
            />
            {errors.sku && (
              <p className="text-xs text-destructive">{errors.sku}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ean">EAN</Label>
            <Input
              id="ean"
              value={formData.ean}
              onChange={(e) => handleChange("ean", e.target.value)}
              placeholder="Código de barras"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              placeholder="Ex: Eletrônicos"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost" className="flex items-center gap-1">
              Custo <span className="text-destructive">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="link">Link do Anúncio</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleChange("link", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editProduct ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
