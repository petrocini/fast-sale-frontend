import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  ArrowLeft,
  CalendarOff,
} from "lucide-react";

import { api } from "@/api/axios";
import { useEventStore } from "@/stores/event-store";
import { Event } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const createEventSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    location: z.string().max(255).optional().or(z.literal("")),
    start_time: z.string().min(1, "Data e hora de início são obrigatórias"),
    end_time: z.string().optional().or(z.literal("")),
    is_active: z.coerce.boolean().default(true),
  })
  .refine(
    (data) =>
      !data.end_time ||
      new Date(data.end_time) > new Date(data.start_time),
    { message: "Data de término deve ser após o início", path: ["end_time"] },
  );

type CreateEventForm = z.infer<typeof createEventSchema>;

function defaultStartTime(): string {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}

export function EventSelector() {
  const queryClient = useQueryClient();
  const {
    currentEvent,
    setEvent,
    clearEvent,
    userChoseNoEvent,
    setUserChoseNoEvent,
    eventSelectorOpen,
    closeEventSelector,
  } = useEventStore();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const showSelector =
    (!currentEvent && !userChoseNoEvent) || eventSelectorOpen;
  const blocking = !currentEvent && !userChoseNoEvent;

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["events", "active"],
    queryFn: async () => {
      const response = await api.get("/events");
      return response.data.filter((e: Event) => e.is_active);
    },
    enabled: showSelector,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const payload = {
        name: data.name,
        location: data.location || undefined,
        start_time: new Date(data.start_time).toISOString(),
        end_time: data.end_time
          ? new Date(data.end_time).toISOString()
          : undefined,
        is_active: data.is_active,
      };
      const res = await api.post<Event>("/events", payload);
      return res.data;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events", "active"] });
      setEvent(event);
      setIsCreating(false);
      closeEventSelector();
      setCreateError(null);
    },
    onError: (err: any) => {
      const data = err.response?.data;
      const msg =
        data?.message ??
        (typeof data?.errors === "object"
          ? (Object.values(data.errors).flat() as string[])[0]
          : null) ??
        "Erro ao criar evento. Tente novamente.";
      setCreateError(msg);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      location: "",
      start_time: defaultStartTime(),
      end_time: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (currentEvent) {
      setIsCreating(false);
      closeEventSelector();
      return;
    }

    if (events?.length === 1) {
      setEvent(events[0]);
      closeEventSelector();
    }
  }, [currentEvent, events, setEvent, closeEventSelector]);

  function handleSelect(event: Event) {
    setEvent(event);
    closeEventSelector();
  }

  function handleContinueWithoutEvent() {
    clearEvent();
    setUserChoseNoEvent(true);
    setIsCreating(false);
    closeEventSelector();
  }

  function handleOpenCreate() {
    setCreateError(null);
    reset({
      name: "",
      location: "",
      start_time: defaultStartTime(),
      end_time: "",
      is_active: true,
    });
    setIsCreating(true);
  }

  function handleBackFromCreate() {
    setIsCreating(false);
    setCreateError(null);
  }

  if (currentEvent && !eventSelectorOpen) return null;
  if (!showSelector) return null;

  return (
    <Dialog
      open={showSelector}
      onOpenChange={(open) => {
        if (!open && !blocking) closeEventSelector();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => blocking && e.preventDefault()}
      >
        {isCreating ? (
          <>
            <DialogHeader>
              <DialogTitle>Criar novo evento</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um evento ativo e começar as
                vendas.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="grid gap-4 py-4"
            >
              {createError && (
                <div
                  className={cn(
                    "text-sm p-3 rounded-md flex items-center gap-2",
                    "bg-destructive/15 text-destructive",
                  )}
                >
                  {createError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Feira de Artesanato"
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

              <div className="grid gap-2">
                <Label htmlFor="location">Local (opcional)</Label>
                <Input
                  id="location"
                  placeholder="Ex: Praça Central"
                  {...register("location")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="start_time">Data e hora de início *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  {...register("start_time")}
                  className={
                    errors.start_time
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.start_time && (
                  <span className="text-xs text-destructive">
                    {errors.start_time.message}
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_time">Data e hora de término (opcional)</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  {...register("end_time")}
                  className={
                    errors.end_time
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {errors.end_time && (
                  <span className="text-xs text-destructive">
                    {errors.end_time.message}
                  </span>
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
                  Evento ativo (usar para vendas)
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBackFromCreate}
                  disabled={createMutation.isPending}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar evento
                    </>
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={handleContinueWithoutEvent}
                disabled={createMutation.isPending}
              >
                <CalendarOff className="h-4 w-4" />
                Continuar sem evento
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Selecione o Evento</DialogTitle>
              <DialogDescription>
                Escolha um evento para as vendas ou continue sem evento (ex.:
                meio de semana).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : events && events.length > 0 ? (
                <>
                  <div className="grid gap-2">
                    {events.map((event) => (
                      <Card
                        key={event.id}
                        className="p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                        onClick={() => handleSelect(event)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{event.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.location || "Sem local"}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                      </Card>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                    onClick={handleContinueWithoutEvent}
                  >
                    <CalendarOff className="h-4 w-4" />
                    Continuar sem evento
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground space-y-4">
                  <p>Nenhum evento ativo encontrado.</p>
                  <p className="text-xs">
                    Crie um novo evento, continue sem evento (ex.: meio de
                    semana) ou recarregue a lista.
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button className="gap-2" onClick={handleOpenCreate}>
                        <Plus className="h-4 w-4" />
                        Criar novo evento
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                      >
                        Recarregar
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="gap-2 text-muted-foreground hover:text-foreground"
                      onClick={handleContinueWithoutEvent}
                    >
                      <CalendarOff className="h-4 w-4" />
                      Continuar sem evento
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
