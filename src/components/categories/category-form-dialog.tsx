import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";

import { api } from "@/api/axios";
import { Category } from "@/types";
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
import { cn } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  icon: z.string().max(50).optional().or(z.literal("")),
  is_active: z.coerce.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: "",
      is_active: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const payload = {
        name: data.name,
        icon: data.icon || undefined,
        is_active: data.is_active,
      };

      if (isEditing) {
        const res = await api.put<Category>(`/categories/${category!.id}`, payload);
        return res.data;
      }

      const res = await api.post<Category>("/categories", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const e = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      const msg = e.response?.data?.message;
      const errs = e.response?.data?.errors;
      if (msg) setError("root", { message: msg });
      if (typeof errs === "object") {
        if (errs.name?.[0]) setError("name", { message: errs.name[0] });
        if (errs.icon?.[0]) setError("icon", { message: errs.icon[0] });
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    clearErrors("root");
    if (category) {
      reset({
        name: category.name,
        icon: category.icon ?? "",
        is_active: category.is_active,
      });
    } else {
      reset({
        name: "",
        icon: "",
        is_active: true,
      });
    }
  }, [open, category, reset, clearErrors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da categoria."
              : "Cadastre uma categoria para organizar os produtos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="grid gap-4">
          {errors.root && (
            <div
              className={cn(
                "text-sm p-3 rounded-md flex items-center gap-2",
                "bg-destructive/15 text-destructive",
              )}
            >
              <AlertCircle className="h-4 w-4" />
              {errors.root.message}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: Bebidas"
              {...register("name")}
              className={
                errors.name ? "border-destructive focus-visible:ring-destructive" : ""
              }
            />
            {errors.name && (
              <span className="text-xs text-destructive">{errors.name.message}</span>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="icon">Ícone (opcional)</Label>
            <Input id="icon" placeholder="Ex: coffee" {...register("icon")} />
            {errors.icon && (
              <span className="text-xs text-destructive">{errors.icon.message}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">
              Ativa
            </Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
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

