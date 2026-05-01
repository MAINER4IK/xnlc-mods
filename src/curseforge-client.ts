// ============================================================
// XNLC Mods — CurseForge API Client
// Author: MAINER4IK
// ============================================================

import type {
  ContentType,
  ModSort,
  ModSearchResult,
  ModSearchResponse,
  ModDetails,
  ModVersion,
} from "./types.js";
import { MOD_SORT_OPTIONS, CONTENT_TYPE_FACETS } from "./types.js";

const CF_API_KEY = process.env.CF_API_KEY || "$2a$10$bL4bIL5pUWqfcO7KQtnMReakwtfHbNKh6v1uTpKlzhwoueEJQnPnm";
const CF_BASE = "https://api.curseforge.com/v1";
const CF_GAME_ID_MINECRAFT = 432;
const MODS_PER_PAGE = 10;

export async function cfFetch(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${CF_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { "x-api-key": CF_API_KEY } });
  if (!res.ok) throw new Error(`CF API ${res.status}: ${res.statusText}`);
  return await res.json();
}

function normalizeCFCategories(categories: unknown[]): string[] {
  return categories?.map((c: any) => c.name ?? c.slug ?? "").filter(Boolean) ?? [];
}

function normalizeCFSearchItem(item: any): ModSearchResult {
  const primaryFile = item.latestFiles?.find((f: any) => f.isAvailable) ?? item.latestFiles?.[0];
  return {
    id: `cf-${item.id}`,
    slug: item.slug ?? item.name?.toLowerCase().replace(/\s+/g, "-") ?? `mod-${item.id}`,
    name: item.name ?? "Unknown",
    summary: item.summary ?? "",
    iconUrl: item.links?.iconUrl ?? item.logo?.thumbnailUrl ?? "",
    downloadCount: item.downloadCount ?? 0,
    categories: normalizeCFCategories(item.categories ?? []).slice(0, 5),
    source: "curseforge",
    modId: item.id,
    primaryFileId: primaryFile?.id ?? 0,
    primaryFileName: primaryFile?.fileName ?? "",
    fileSize: primaryFile?.fileLength ?? 0,
    dateCreated: item.dateCreated ?? primaryFile?.fileDate ?? undefined,
    dateModified: item.dateModified ?? primaryFile?.fileDate ?? undefined,
  };
}

function normalizeCFVersion(f: any): ModVersion {
  return {
    id: String(f.id ?? ""),
    name: f.displayName ?? f.fileName ?? `v${f.id}`,
    gameVersion: f.gameVersions?.join(", ") ?? "",
    downloadCount: f.downloadCount ?? 0,
    fileName: f.fileName ?? "",
    fileSize: f.fileLength ?? 0,
  };
}

export async function curseforgeSearch(
  query: string,
  options?: {
    contentType?: ContentType;
    gameVersion?: string;
    modLoader?: string;
    sortBy?: ModSort;
    page?: number;
  },
): Promise<ModSearchResponse> {
  const contentType = options?.contentType ?? "mod";
  const gameVersion = options?.gameVersion;
  const modLoader = options?.modLoader;
  const sortBy = options?.sortBy ?? "downloads";
  const page = options?.page ?? 0;

  const classId = CONTENT_TYPE_FACETS[contentType].cfClassId;
  const sortOption = MOD_SORT_OPTIONS.find(o => o.id === sortBy);

  const params: Record<string, string> = {
    gameId: String(CF_GAME_ID_MINECRAFT),
    classId: String(classId),
    pageSize: String(MODS_PER_PAGE),
    sortField: String(sortOption?.cfSortField ?? 2),
    sortOrder: "desc",
  };
  if (query.trim()) params.searchFilter = query.trim();
  if (gameVersion) params.gameVersion = gameVersion;
  if (modLoader) params.modLoader = modLoader;
  if (page > 0) params.pageNumber = String(page + 1);

  try {
    const data = (await cfFetch("/mods/search", params)) as {
      data?: any[];
      pagination?: { totalCount?: number };
    };
    return {
      results: (data.data ?? []).map(normalizeCFSearchItem),
      totalCount: data.pagination?.totalCount ?? 0,
    };
  } catch (err) {
    console.error("CF search error:", err);
    return { results: [], totalCount: 0 };
  }
}

export async function curseforgeGetDetails(modId: number): Promise<ModDetails | null> {
  try {
    const modRes = (await cfFetch(`/mods/${modId}`)) as { data?: any };
    const filesRes = (await cfFetch(`/mods/${modId}/files`, { pageSize: "30" })) as { data?: any[] };
    const mod = modRes.data;
    if (!mod) return null;

    return {
      id: `cf-${mod.id}`,
      slug: mod.slug ?? `mod-${mod.id}`,
      name: mod.name,
      summary: mod.summary ?? "",
      description: mod.description ?? mod.summary ?? "",
      iconUrl: mod.links?.iconUrl ?? mod.logo?.thumbnailUrl ?? "",
      downloadCount: mod.downloadCount ?? 0,
      categories: normalizeCFCategories(mod.categories ?? []).slice(0, 5),
      versions: (filesRes.data ?? []).map(normalizeCFVersion),
      gallery: (mod.screenshots ?? []).map((s: any) => ({
        url: s.url ?? s.thumbnailUrl ?? "",
        title: s.title ?? "",
      })),
      source: "curseforge",
      modId: mod.id,
    };
  } catch (err) {
    console.error("CF mod-details error:", err);
    return null;
  }
}

export async function curseforgeGetFileDownloadUrl(fileId: number, modId: number): Promise<string | null> {
  try {
    const data = (await cfFetch(`/mods/${modId}/files/${fileId}/download-url`)) as { data?: string };
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function curseforgeCategories(): Promise<Array<{ id: number; slug: string; name: string }>> {
  try {
    const data = (await cfFetch("/mods/categories", { gameId: String(CF_GAME_ID_MINECRAFT) })) as {
      data?: Array<{ id: number; slug: string; name: string }>;
    };
    return (data.data ?? []).map(c => ({ id: c.id, slug: c.slug, name: c.name }));
  } catch {
    return [];
  }
}

export async function curseforgeFeatured(gameVersion?: string): Promise<{ popular: ModSearchResult[]; trending: ModSearchResult[] }> {
  try {
    const params: Record<string, string> = { gameId: String(CF_GAME_ID_MINECRAFT) };
    if (gameVersion) params.gameVersion = gameVersion;
    const data = (await cfFetch("/mods/featured", params)) as {
      data?: { popular?: any[]; trending?: any[] };
    };
    const popular = (data.data?.popular ?? []).map(item => normalizeCFSearchItem(item));
    const trending = (data.data?.trending ?? []).map(item => normalizeCFSearchItem(item));
    return { popular, trending };
  } catch {
    return { popular: [], trending: [] };
  }
}
