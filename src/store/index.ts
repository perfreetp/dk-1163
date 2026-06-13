import { create } from 'zustand';
import type { Version, Requirement, Screenshot, TrackingPoint, AcceptanceCriteria, Review, ModuleScore, TestFocus, Issue } from '../../shared/types';

interface VersionState {
  versions: Version[];
  currentVersion: Version | null;
  setVersions: (versions: Version[]) => void;
  setCurrentVersion: (version: Version | null) => void;
  addVersion: (version: Version) => void;
  updateVersion: (version: Version) => void;
  deleteVersion: (id: string) => void;
}

export const useVersionStore = create<VersionState>((set) => ({
  versions: [],
  currentVersion: null,
  setVersions: (versions) => set({ versions }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
  addVersion: (version) => set((state) => ({ versions: [version, ...state.versions] })),
  updateVersion: (version) => set((state) => ({
    versions: state.versions.map((v) => (v.id === version.id ? version : v)),
    currentVersion: state.currentVersion?.id === version.id ? version : state.currentVersion,
  })),
  deleteVersion: (id) => set((state) => ({
    versions: state.versions.filter((v) => v.id !== id),
    currentVersion: state.currentVersion?.id === id ? null : state.currentVersion,
  })),
}));

interface RequirementState {
  requirements: Requirement[];
  screenshots: Screenshot[];
  trackingPoints: TrackingPoint[];
  acceptanceCriteria: AcceptanceCriteria[];
  setRequirements: (requirements: Requirement[]) => void;
  setScreenshots: (screenshots: Screenshot[]) => void;
  setTrackingPoints: (points: TrackingPoint[]) => void;
  setAcceptanceCriteria: (criteria: AcceptanceCriteria[]) => void;
  addRequirement: (requirement: Requirement) => void;
  updateRequirement: (requirement: Requirement) => void;
  deleteRequirement: (id: string) => void;
  addScreenshot: (screenshot: Screenshot) => void;
  deleteScreenshot: (id: string) => void;
  addTrackingPoint: (point: TrackingPoint) => void;
  updateTrackingPoint: (point: TrackingPoint) => void;
  deleteTrackingPoint: (id: string) => void;
  addAcceptanceCriteria: (criteria: AcceptanceCriteria) => void;
  updateAcceptanceCriteria: (criteria: AcceptanceCriteria) => void;
  deleteAcceptanceCriteria: (id: string) => void;
}

export const useRequirementStore = create<RequirementState>((set) => ({
  requirements: [],
  screenshots: [],
  trackingPoints: [],
  acceptanceCriteria: [],
  setRequirements: (requirements) => set({ requirements }),
  setScreenshots: (screenshots) => set({ screenshots }),
  setTrackingPoints: (points) => set({ trackingPoints: points }),
  setAcceptanceCriteria: (criteria) => set({ acceptanceCriteria: criteria }),
  addRequirement: (requirement) => set((state) => ({ requirements: [...state.requirements, requirement] })),
  updateRequirement: (requirement) => set((state) => ({
    requirements: state.requirements.map((r) => (r.id === requirement.id ? requirement : r)),
  })),
  deleteRequirement: (id) => set((state) => ({ requirements: state.requirements.filter((r) => r.id !== id) })),
  addScreenshot: (screenshot) => set((state) => ({ screenshots: [...state.screenshots, screenshot] })),
  deleteScreenshot: (id) => set((state) => ({ screenshots: state.screenshots.filter((s) => s.id !== id) })),
  addTrackingPoint: (point) => set((state) => ({ trackingPoints: [...state.trackingPoints, point] })),
  updateTrackingPoint: (point) => set((state) => ({
    trackingPoints: state.trackingPoints.map((p) => (p.id === point.id ? point : p)),
  })),
  deleteTrackingPoint: (id) => set((state) => ({ trackingPoints: state.trackingPoints.filter((p) => p.id !== id) })),
  addAcceptanceCriteria: (criteria) => set((state) => ({ acceptanceCriteria: [...state.acceptanceCriteria, criteria] })),
  updateAcceptanceCriteria: (criteria) => set((state) => ({
    acceptanceCriteria: state.acceptanceCriteria.map((c) => (c.id === criteria.id ? criteria : c)),
  })),
  deleteAcceptanceCriteria: (id) => set((state) => ({ acceptanceCriteria: state.acceptanceCriteria.filter((c) => c.id !== id) })),
}));

interface ReviewState {
  review: Review | null;
  moduleScores: ModuleScore[];
  testFocuses: TestFocus[];
  issues: Issue[];
  setReview: (review: Review | null) => void;
  setModuleScores: (scores: ModuleScore[]) => void;
  setTestFocuses: (focuses: TestFocus[]) => void;
  setIssues: (issues: Issue[]) => void;
  updateIssue: (issue: Issue) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  review: null,
  moduleScores: [],
  testFocuses: [],
  issues: [],
  setReview: (review) => set({ review }),
  setModuleScores: (scores) => set({ moduleScores: scores }),
  setTestFocuses: (focuses) => set({ testFocuses: focuses }),
  setIssues: (issues) => set({ issues }),
  updateIssue: (issue) => set((state) => ({
    issues: state.issues.map((i) => (i.id === issue.id ? issue : i)),
  })),
}));