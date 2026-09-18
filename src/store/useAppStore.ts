// ===================================================================
// Global Application State Store (Zustand)
// Manages UI state, active filters, theme, and modal visibility.
// ===================================================================
import { create } from 'zustand';
import type { CPPlatform } from '../types';

// ===================================================================
// Filter State
// ===================================================================
export interface ProblemFilters {
  platforms: CPPlatform[];
  tags: string[];
  categories: string[];
  difficultyRange: [number | null, number | null];
  dueOnly: boolean;
  searchQuery: string;
}

export interface AcademicFilters {
  courseIds: string[];
  masteryRange: [number, number];
  dueOnly: boolean;
  searchQuery: string;
}

function createDefaultProblemFilters(): ProblemFilters {
  return {
    platforms: [],
    tags: [],
    categories: [],
    difficultyRange: [null, null],
    dueOnly: false,
    searchQuery: '',
  };
}

function createDefaultAcademicFilters(): AcademicFilters {
  return {
    courseIds: [],
    masteryRange: [1, 5],
    dueOnly: false,
    searchQuery: '',
  };
}

// ===================================================================
// Navigation & Modal State
// ===================================================================
export type ActiveTab =
  | 'dashboard'
  | 'problems'
  | 'university'
  | 'review'
  | 'settings';

export type ModalType =
  | 'addProblem'
  | 'addTopic'
  | 'importBackup'
  | 'exportBackup'
  | 'problemDetail'
  | 'topicDetail'
  | null;

// ===================================================================
// Store Shape
// ===================================================================
export interface AppState {
  // Theme
  theme: 'dark' | 'light' | 'system';
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Modals
  activeModal: ModalType;
  modalData: Record<string, unknown>;
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Problem Filters
  problemFilters: ProblemFilters;
  setProblemFilters: (filters: Partial<ProblemFilters>) => void;
  resetProblemFilters: () => void;

  // Academic Filters
  academicFilters: AcademicFilters;
  setAcademicFilters: (filters: Partial<AcademicFilters>) => void;
  resetAcademicFilters: () => void;

  // Review session state
  reviewSessionActive: boolean;
  reviewItemIds: string[];
  currentReviewIndex: number;
  startReviewSession: (itemIds: string[]) => void;
  advanceReview: () => void;
  endReviewSession: () => void;
}

// ===================================================================
// Resolve system theme preference
// ===================================================================
function resolveTheme(theme: 'dark' | 'light' | 'system'): 'dark' | 'light' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// ===================================================================
// Store
// ===================================================================
export const useAppStore = create<AppState>((set) => ({
  // Theme
  theme: 'system',
  resolvedTheme: resolveTheme('system'),
  setTheme: (theme) =>
    set({ theme, resolvedTheme: resolveTheme(theme) }),

  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modals
  activeModal: null,
  modalData: {},
  openModal: (modal, data = {}) =>
    set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: {} }),

  // Problem Filters
  problemFilters: createDefaultProblemFilters(),
  setProblemFilters: (filters) =>
    set((state) => ({
      problemFilters: { ...state.problemFilters, ...filters },
    })),
  resetProblemFilters: () =>
    set({ problemFilters: createDefaultProblemFilters() }),

  // Academic Filters
  academicFilters: createDefaultAcademicFilters(),
  setAcademicFilters: (filters) =>
    set((state) => ({
      academicFilters: { ...state.academicFilters, ...filters },
    })),
  resetAcademicFilters: () =>
    set({ academicFilters: createDefaultAcademicFilters() }),

  // Review Session
  reviewSessionActive: false,
  reviewItemIds: [],
  currentReviewIndex: 0,
  startReviewSession: (itemIds) =>
    set({
      reviewSessionActive: true,
      reviewItemIds: itemIds,
      currentReviewIndex: 0,
    }),
  advanceReview: () =>
    set((state) => {
      const nextIndex = state.currentReviewIndex + 1;
      if (nextIndex >= state.reviewItemIds.length) {
        return {
          reviewSessionActive: false,
          reviewItemIds: [],
          currentReviewIndex: 0,
        };
      }
      return { currentReviewIndex: nextIndex };
    }),
  endReviewSession: () =>
    set({
      reviewSessionActive: false,
      reviewItemIds: [],
      currentReviewIndex: 0,
    }),
}));
