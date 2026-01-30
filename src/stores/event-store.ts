import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Event } from "@/types";

interface EventState {
  currentEvent: Event | null;
  userChoseNoEvent: boolean;
  eventSelectorOpen: boolean;
  setEvent: (event: Event) => void;
  clearEvent: () => void;
  setUserChoseNoEvent: (value: boolean) => void;
  openEventSelector: () => void;
  closeEventSelector: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      currentEvent: null,
      userChoseNoEvent: false,
      eventSelectorOpen: false,
      setEvent: (event) =>
        set({ currentEvent: event, userChoseNoEvent: false }),
      clearEvent: () => set({ currentEvent: null }),
      setUserChoseNoEvent: (value) => set({ userChoseNoEvent: value }),
      openEventSelector: () => set({ eventSelectorOpen: true }),
      closeEventSelector: () => set({ eventSelectorOpen: false }),
    }),
    {
      name: "@fastsale:event",
      partialize: (state) => ({
        currentEvent: state.currentEvent,
        userChoseNoEvent: state.userChoseNoEvent,
      }),
    },
  ),
);
