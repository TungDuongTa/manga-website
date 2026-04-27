// OTruyen API Types

export interface OTruyenResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface OTruyenHomeData {
  seoOnPage: SeoOnPage;
  items: OTruyenComic[];
}

export interface OTruyenListData {
  seoOnPage: SeoOnPage;
  breadCrumb: BreadCrumb[];
  titlePage: string;
  items: OTruyenComic[];
  params: ListParams;
}

export interface SeoOnPage {
  og_type: string;
  titleHead: string;
  descriptionHead: string;
  og_image: string[];
  og_url: string;
}

export interface BreadCrumb {
  name: string;
  slug?: string;
  isCurrent: boolean;
  position: number;
}

export interface ListParams {
  type_slug: string;
  filterCategory: string[];
  sortField: string;
  sortType: string;
  pagination: Pagination;
}

export interface Pagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  pageRanges: number;
}

export interface OTruyenComic {
  _id: string;
  name: string;
  slug: string;
  origin_name: string[];
  status: string;
  thumb_url: string;
  sub_docquyen: boolean;
  category: Category[];
  updatedAt: string;
  chaptersLatest?: ChapterLatest[];
  totalViews?: number;
  periodViews?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ChapterLatest {
  filename: string;
  chapter_name: string;
  chapter_title: string;
  chapter_api_data: string;
}

export interface OTruyenComicDetail {
  seoOnPage: SeoOnPage;
  breadCrumb: BreadCrumb[];
  params: {
    slug: string;
  };
  item: ComicDetailItem;
}

export interface ComicDetailItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string[];
  content: string;
  status: string;
  thumb_url: string;
  sub_docquyen: boolean;
  author: string[];
  category: Category[];
  chapters: ChapterGroup[];
  updatedAt: string;
}

export interface ChapterGroup {
  server_name: string;
  server_data: ChapterData[];
}

export interface ChapterData {
  filename: string;
  chapter_name: string;
  chapter_title: string;
  chapter_api_data: string;
}

export interface OTruyenChapterData {
  seoOnPage: SeoOnPage;
  breadCrumb: BreadCrumb[];
  params: {
    slug: string;
  };
  item: ChapterItem;
}

export interface ChapterItem {
  _id: string;
  comic_name: string;
  chapter_name: string;
  chapter_title: string;
  chapter_path: string;
  chapter_image: ChapterImage[];
}

export interface ChapterImage {
  image_page: number;
  image_file: string;
}

export interface OTruyenCategoryData {
  items: Category[];
}

export interface OTruyenSearchData {
  seoOnPage: SeoOnPage;
  breadCrumb: BreadCrumb[];
  titlePage: string;
  items: OTruyenComic[];
  params: ListParams;
}

// CDN Base URL for cover images
export const CDN_IMAGE_URL = "https://img.otruyenapi.com/uploads/comics";

// CDN Base URL for chapter images
export const CDN_CHAPTER_URL = "https://sv1.otruyencdn.com";

// Helper to get full cover image URL
export function getImageUrl(thumbUrl: string): string {
  if (thumbUrl.startsWith("http")) return thumbUrl;
  return `${CDN_IMAGE_URL}/${thumbUrl}`;
}

// Helper to get full chapter image URL
export function getChapterImageUrl(
  chapterPath: string,
  imageFile: string,
): string {
  // chapterPath is like: uploads/20260407/xxx/chapter_45
  // imageFile is like: page_0.jpg
  return `${CDN_CHAPTER_URL}/${chapterPath}/${imageFile}`;
}

// Helper to format status
export function formatStatus(status: string): string {
  switch (status) {
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "coming_soon":
      return "Coming soon";
    default:
      return status;
  }
}

// Helper to format date
export function formatUpdatedAt(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
