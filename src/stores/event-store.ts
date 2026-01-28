import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Event } from "@/types";

interface EventState {
  currentEvent: Event | null;
  setEvent: (event: Event) => void;
  clearEvent: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      currentEvent: null,
      setEvent: (event) => set({ currentEvent: event }),
      clearEvent: () => set({ currentEvent: null }),
    }),
    {
      name: "@fastsale:event",
    },
  ),
);
