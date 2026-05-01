// ============================================================
// XNLC Mods — Shared Types
// Author: MAINER4IK
// ============================================================

export type ContentType = "mod" | "modpack" | "resourcepack" | "shader";
export type ModSort = "downloads" | "popular" | "updated" | "published";

export interface ModSearchResult {
  id: string;
  slug: string;
  name: string;
  summary: string;
  iconUrl: string;
  downloadCount: number;
  categories: string[];
  source: "modrinth" | "curseforge";
  /** Modrinth-specific */
  projectId?: string;
  /** CurseForge-specific */
  modId?: number;
  primaryFileId?: number;
  primaryFileName?: string;
  fileSize?: number;
  dateCreated?: string;
  dateModified?: string;
}

export interface ModSearchResponse {
  results: ModSearchResult[];
  totalCount: number;
}

export interface ModVersion {
  id: string;
  name: string;
  gameVersion: string;
  downloadCount: number;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  versionType?: "release" | "beta" | "alpha";
  loaders?: string[];
  changelog?: string;
  datePublished?: string;
  files?: { url: string; size: number; filename: string }[];
}

export interface ModDetails {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  iconUrl: string;
  downloadCount: number;
  categories: string[];
  versions: ModVersion[];
  gallery: { url: string; title?: string }[];
  source: "modrinth" | "curseforge";
  body?: string;
  /** CurseForge-specific numeric mod ID */
  modId?: number;
  /** Modrinth-specific project ID */
  projectId?: string;
}

export interface ModSortOption {
  id: ModSort;
  modrinthIndex: string;
  cfSortField: number;
}

export const MOD_SORT_OPTIONS: ModSortOption[] = [
  { id: "downloads", modrinthIndex: "downloads", cfSortField: 2 },
  { id: "popular", modrinthIndex: "follows", cfSortField: 4 },
  { id: "updated", modrinthIndex: "updated", cfSortField: 3 },
  { id: "published", modrinthIndex: "newest", cfSortField: 11 },
];

export const CONTENT_TYPE_FACETS: Record<ContentType, { facet: string; cfClassId: number }> = {
  mod: { facet: "mod", cfClassId: 6 },
  modpack: { facet: "modpack", cfClassId: 4471 },
  resourcepack: { facet: "resourcepack", cfClassId: 12 },
  shader: { facet: "shader", cfClassId: 6552 },
};
