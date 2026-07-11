
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnalysisReport } from './types'

interface Store {
  reports: AnalysisReport[]
  activeReportId: string | null
  addReport: (r: AnalysisReport) => void
  removeReport: (id: string) => void
  setActive: (id: string | null) => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      reports: [],
      activeReportId: null,
      addReport: (r) =>
        set((s) => ({ reports: [r, ...s.reports], activeReportId: r.id })),
      removeReport: (id) =>
        set((s) => ({
          reports: s.reports.filter((r) => r.id !== id),
          activeReportId: s.activeReportId === id ? null : s.activeReportId,
        })),
      setActive: (id) => set({ activeReportId: id }),
    }),
    { name: 'leakfinder-store' },
  ),
)
