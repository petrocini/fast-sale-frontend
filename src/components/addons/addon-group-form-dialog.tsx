import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";

import { api } from "@/api/axios";
import { AddonGroup } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const addonItemSchema = z.object({
  name: z.string().min(1, "Nome do adicional é obrigatório"),
  price: z.coerce.number().min(0, "Preço deve ser ≥ 0"),
  is_available: z.coerce.boolean().default(true),
});

const addonGroupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  description: z.string().optional().or(z.literal("")),
  is_active: z.coerce.boolean().default(true),
  items: z.array(addonItemSchema).default([]),
});

type AddonGroupFormValues = z.infer<typeof addonGroupSchema>;

interface AddonGroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: AddonGroup | null;
}

export function AddonGroupFormDialog({
  open,
  onOpenChange,
  group,
}: AddonGroupFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!group;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<AddonGroupFormValues>({
    resolver: zodResolver(addonGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const mutation = useMutation({
    mutationFn: async (data: AddonGroupFormValues) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        is_active: data.is_active,
        items: data.items?.length
          ? data.items.map((i) => ({
              name: i.name,
              price: i.price,
              is_available: i.is_available,
            }))
          : [],
      };

      if (isEditing) {
        const res = await api.put<AddonGroup>(
          `/addon-groups/${group!.id}`,
          payload,
        );
        return res.data;
      }

      const res = await api.post<AddonGroup>("/addon-groups", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addon-groups"] });
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
        const first = (Object.values(errs).flat() as string[])[0];
        if (first) setError("root", { message: first });
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    clearErrors("root");
    if (group) {
      reset({
        name: group.name,
        description: group.description ?? "",
        is_active: group.is_active ?? true,
        items:
          group.items?.map((i) => ({
            name: i.name,
            price: Number(i.price),
            is_available: i.is_available ?? true,
          })) ?? [],
      });
    } else {
      reset({
        name: "",
        description: "",
        is_active: true,
        items: [],
      });
    }
  }, [open, group, reset, clearErrors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border shrink-0">
          <DialogTitle>
            {isEditing ? "Editar grupo de adicionais" : "Novo grupo de adicionais"}
          </DialogTitle>
          <DialogDescription>
            Crie o grupo e gerencie os itens (adicionais) disponíveis para seleção.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="flex flex-col flex-1 min-h-0"
        >
          {errors.root && (
            <div
              className={cn(
                "mx-6 mt-4 text-sm p-3 rounded-md flex items-center gap-2",
                "bg-destructive/15 text-destructive",
              )}
            >
              <AlertCircle className="h-4 w-4" />
              {errors.root.message}
            </div>
          )}

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Tamanhos, Acompanhamentos"
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

                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register("is_active")}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="is_active" className="font-normal cursor-pointer">
                      Grupo ativo
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Opcional"
                  {...register("description")}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Itens do grupo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => append({ name: "", price: 0, is_available: true })}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar item
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado. Você pode cadastrar o grupo vazio e adicionar itens depois.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((f, idx) => (
                      <div
                        key={f.id}
                        className="grid grid-cols-12 gap-3 p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="col-span-12 sm:col-span-6 space-y-2">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            placeholder="Ex: Queijo extra"
                            {...register(`items.${idx}.name`)}
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-3 space-y-2">
                          <Label className="text-xs">Preço</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            {...register(`items.${idx}.price`)}
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-2 space-y-2 flex flex-col justify-end">
                          <div className="flex items-center gap-2 h-10">
                            <input
                              type="checkbox"
                              {...register(`items.${idx}.is_available`)}
                              className="h-4 w-4 rounded border-input"
                            />
                            <span className="text-sm text-muted-foreground">
                              Disponível
                            </span>
                          </div>
                        </div>

                        <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-border bg-muted/10 flex gap-2 justify-end shrink-0">
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

