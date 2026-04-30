import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { MangaCardApi } from "@/components/manga-card-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getManga18ListPage } from "@/lib/actions/manga18.actions";
import { getVisiblePages } from "@/lib/pagination";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const toSafePageNumber = (value: string | undefined): number => {
  const parsed = Number.parseInt(value || "1", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return parsed;
};

export default async function Manga18Page({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const currentPage = toSafePageNumber(page);

  const data = await getManga18ListPage({ page: currentPage });
  const comics = data.items;
  const pagination = data.pagination;
  const totalPages = Math.max(
    1,
    Math.ceil(pagination.totalItems / pagination.totalItemsPerPage),
  );
  const safeCurrentPage = Math.min(
    Math.max(1, pagination.currentPage || currentPage),
    totalPages,
  );
  const visiblePages = getVisiblePages(safeCurrentPage, totalPages);

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">18+ Library</h1>
          </div>
          <p className="text-muted-foreground">
            Mature manga collection powered by your `mangas18` and `chapters18`
            collections.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Badge className="bg-accent text-accent-foreground">
            {pagination.totalItems} total
          </Badge>
          <p className="text-sm text-muted-foreground">
            Page {safeCurrentPage} of {totalPages}
          </p>
        </div>

        {comics.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6">
            {comics.map((comic) => (
              <MangaCardApi
                key={comic._id}
                comic={comic}
                routeBase="/18+"
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">
              No 18+ manga found
            </h3>
            <p className="text-muted-foreground">
              Add documents into `mangas18` to populate this page.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {safeCurrentPage > 1 ? (
              <Link href={`/18+?page=${safeCurrentPage - 1}`}>
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-1">
              {visiblePages.map((pageNum) => (
                <Link key={pageNum} href={`/18+?page=${pageNum}`}>
                  <Button
                    variant={pageNum === safeCurrentPage ? "default" : "outline"}
                    size="icon"
                  >
                    {pageNum}
                  </Button>
                </Link>
              ))}
            </div>

            {safeCurrentPage < totalPages ? (
              <Link href={`/18+?page=${safeCurrentPage + 1}`}>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

