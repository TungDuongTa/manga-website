"use server"

import {
  OTruyenResponse,
  OTruyenHomeData,
  OTruyenListData,
  OTruyenComicDetail,
  OTruyenChapterData,
  OTruyenCategoryData,
  OTruyenSearchData,
  OTruyenComic,
  Category,
} from "./otruyen-types"

const BASE_URL = "https://otruyenapi.com/v1/api"

// Fetch home page data
export async function getHomeData(): Promise<OTruyenHomeData | null> {
  try {
    const res = await fetch(`${BASE_URL}/home`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenHomeData> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch home data:", error)
    return null
  }
}

// Fetch manga list by type (truyen-moi, dang-phat-hanh, hoan-thanh, sap-ra-mat)
export async function getListByType(
  type: string,
  page: number = 1
): Promise<OTruyenListData | null> {
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/${type}?page=${page}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenListData> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch list:", error)
    return null
  }
}

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${BASE_URL}/the-loai`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    if (!res.ok) return []
    const data: OTruyenResponse<OTruyenCategoryData> = await res.json()
    return data.data.items
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }
}

// Fetch manga by category
export async function getByCategory(
  slug: string,
  page: number = 1
): Promise<OTruyenListData | null> {
  try {
    const res = await fetch(`${BASE_URL}/the-loai/${slug}?page=${page}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenListData> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return null
  }
}

// Fetch manga detail by slug
export async function getComicDetail(
  slug: string
): Promise<OTruyenComicDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/truyen-tranh/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenComicDetail> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch comic detail:", error)
    return null
  }
}

// Fetch chapter data
export async function getChapterData(
  chapterApiUrl: string
): Promise<OTruyenChapterData | null> {
  try {
    // The chapterApiUrl is the full API URL for the chapter
    const res = await fetch(chapterApiUrl, {
      next: { revalidate: 3600 }, // Cache chapters longer
    })
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenChapterData> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch chapter data:", error)
    return null
  }
}

// Search manga
export async function searchComics(
  keyword: string,
  page: number = 1
): Promise<OTruyenSearchData | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
      {
        next: { revalidate: 60 },
      }
    )
    if (!res.ok) return null
    const data: OTruyenResponse<OTruyenSearchData> = await res.json()
    return data.data
  } catch (error) {
    console.error("Failed to search:", error)
    return null
  }
}

// Search comics for autocomplete (returns limited results quickly)
export async function searchComicsQuick(
  keyword: string
): Promise<OTruyenComic[]> {
  if (!keyword || keyword.trim().length < 2) return []
  
  try {
    const res = await fetch(
      `${BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}`,
      {
        cache: "no-store", // Don't cache autocomplete
      }
    )
    if (!res.ok) return []
    const data: OTruyenResponse<OTruyenSearchData> = await res.json()
    return data.data.items.slice(0, 8) // Limit to 8 results for autocomplete
  } catch (error) {
    console.error("Failed to quick search:", error)
    return []
  }
}
