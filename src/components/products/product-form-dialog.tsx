import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";

import { api } from "@/api/axios";
import { Product, Category, AddonGroup } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const addonConfigSchema = z.object({
  group_id: z.coerce.number().min(1, "Selecione um grupo"),
  min_selection: z.coerce.number().int().min(0, "Mín. ≥ 0"),
  max_selection: z.coerce.number().int().min(0, "Máx. ≥ 0"),
  order: z.coerce.number().int().min(0).default(0),
});

const productFormSchema = z
  .object({
    category_id: z.coerce.number().min(1, "Selecione uma categoria"),
    name: z.string().min(1, "Nome é obrigatório").max(255),
    description: z.string().optional().or(z.literal("")),
    price: z.coerce.number().min(0, "Preço deve ser ≥ 0"),
    cost_price: z.preprocess(
      (v) => (v === "" || v === null ? undefined : Number(v)),
      z.number().min(0).optional(),
    ),
    stock_qty: z.coerce.number().int().min(0).default(0),
    is_active: z.coerce.boolean().default(true),
    addon_configs: z.array(addonConfigSchema).optional().default([]),
  })
  .refine(
    (data) =>
      data.addon_configs?.every(
        (c) => c.max_selection >= c.min_selection,
      ) ?? true,
    {
      message: "Máx. seleção deve ser ≥ mín. seleção em cada grupo",
      path: ["addon_configs"],
    },
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  addonGroups: AddonGroup[];
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  addonGroups,
}: ProductFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      category_id: 0,
      name: "",
      description: "",
      price: 0,
      cost_price: undefined,
      stock_qty: 0,
      is_active: true,
      addon_configs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addon_configs",
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        category_id: data.category_id,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        cost_price: data.cost_price,
        stock_qty: data.stock_qty,
        is_active: data.is_active,
        addon_configs: data.addon_configs?.length
          ? data.addon_configs.map((c, i) => ({
              group_id: c.group_id,
              min_selection: c.min_selection,
              max_selection: c.max_selection,
              order: c.order ?? i,
            }))
          : undefined,
      };
      const res = await api.post<Product>("/products", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.message;
      const errs = e.response?.data?.errors;
      if (msg) setError("root", { message: msg });
      if (typeof errs === "object") {
        (Object.entries(errs) as [keyof ProductFormValues, string[]][]).forEach(
          ([key, val]) => val?.[0] && setError(key, { message: val[0] }),
        );
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        category_id: data.category_id,
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        cost_price: data.cost_price,
        stock_qty: data.stock_qty,
        is_active: data.is_active,
        addon_configs: data.addon_configs?.length
          ? data.addon_configs.map((c, i) => ({
              group_id: c.group_id,
              min_selection: c.min_selection,
              max_selection: c.max_selection,
              order: c.order ?? i,
            }))
          : [],
      };
      const res = await api.put<Product>(`/products/${product!.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.message;
      const errs = e.response?.data?.errors;
      if (msg) setError("root", { message: msg });
      if (typeof errs === "object") {
        (Object.entries(errs) as [keyof ProductFormValues, string[]][]).forEach(
          ([key, val]) => val?.[0] && setError(key, { message: val[0] }),
        );
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    clearErrors("root");
    if (product) {
      reset({
        category_id: product.category_id,
        name: product.name,
        description: product.description ?? "",
        price: Number(product.price),
        cost_price: product.cost_price != null ? Number(product.cost_price) : undefined,
        stock_qty: product.stock_qty ?? 0,
        is_active: product.is_active ?? true,
        addon_configs:
          product.addon_configs?.map((c) => ({
            group_id: c.group_id,
            min_selection: c.min_selection,
            max_selection: c.max_selection,
            order: c.order ?? 0,
          })) ?? [],
      });
    } else {
      reset({
        category_id: 0,
        name: "",
        description: "",
        price: 0,
        cost_price: undefined,
        stock_qty: 0,
        is_active: true,
        addon_configs: [],
      });
    }
  }, [open, product, categories, reset, clearErrors]);

  const onSubmit = (data: ProductFormValues) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>
            {isEditing ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do produto abaixo."
              : "Preencha os dados para cadastrar um novo produto."}
          </DialogDescription>
        </DialogHeader>

        {!isEditing && categories.length === 0 && (
          <div
            className={cn(
              "mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg text-sm",
              "bg-amber-500/15 text-amber-700 dark:text-amber-400",
            )}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Cadastre ao menos uma categoria antes de criar produtos.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          {errors.root && (
            <div
              className={cn(
                "mx-6 mt-4 text-sm p-3 rounded-md",
                "bg-destructive/15 text-destructive",
              )}
            >
              {errors.root.message}
            </div>
          )}

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Categoria *</Label>
                  <Select
                    id="category_id"
                    {...register("category_id")}
                    className={
                      errors.category_id
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  >
                    <option value={0}>Selecione</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {errors.category_id && (
                    <span className="text-xs text-destructive">
                      {errors.category_id.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Café expresso"
                    {...register("name")}
                    className={
                      errors.name
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {errors.name && (
                    <span className="text-xs text-destructive">
                      {errors.name.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Opcional"
                  rows={2}
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("price")}
                    className={
                      errors.price
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {errors.price && (
                    <span className="text-xs text-destructive">
                      {errors.price.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Custo</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("cost_price")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_qty">Estoque</Label>
                  <Input
                    id="stock_qty"
                    type="number"
                    min={0}
                    {...register("stock_qty")}
                    className={
                      errors.stock_qty
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {errors.stock_qty && (
                    <span className="text-xs text-destructive">
                      {errors.stock_qty.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register("is_active")}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="is_active" className="font-normal cursor-pointer">
                      Ativo
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Grupos de adicionais</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={addonGroups.length === 0}
                    onClick={() =>
                      append({
                        group_id: addonGroups[0]?.id ?? 0,
                        min_selection: 0,
                        max_selection: 1,
                        order: fields.length,
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                {addonGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre grupos de adicionais para vinculá-los ao produto.
                  </p>
                )}
                {typeof errors.addon_configs === "object" &&
                  "message" in (errors.addon_configs as { message?: string }) && (
                  <span className="text-xs text-destructive">
                    {(errors.addon_configs as { message: string }).message}
                  </span>
                )}
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="space-y-2 flex-1 min-w-[140px]">
                        <Label className="text-xs">Grupo</Label>
                        <Select
                          {...register(`addon_configs.${idx}.group_id`)}
                          className="h-9"
                        >
                          <option value={0}>Selecione</option>
                          {addonGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2 w-20">
                        <Label className="text-xs">Mín</Label>
                        <Input
                          type="number"
                          min={0}
                          {...register(`addon_configs.${idx}.min_selection`)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2 w-20">
                        <Label className="text-xs">Máx</Label>
                        <Input
                          type="number"
                          min={0}
                          {...register(`addon_configs.${idx}.max_selection`)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2 w-16">
                        <Label className="text-xs">Ordem</Label>
                        <Input
                          type="number"
                          min={0}
                          {...register(`addon_configs.${idx}.order`)}
                          className="h-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border bg-muted/10 flex gap-2 justify-end shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!isEditing && categories.length === 0)}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar"
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
