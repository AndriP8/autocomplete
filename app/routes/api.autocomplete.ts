import { data, type LoaderFunctionArgs } from "@remix-run/node";
import db from "~/db";

type Suggestion = {
  term: string;
  popularity: number;
  description: string | null;
  image_src: string | null;
};

export type SuggestionResponse = {
  suggestions: Suggestion[];
  query: string;
};

export async function getSearch({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const searchTerm = query.trim().toLowerCase();

  try {
    const result = await db.query(
      `SELECT term, popularity, description, image_src 
       FROM search 
       WHERE CASE 
         WHEN $1 != '' THEN (LOWER(term) LIKE $2 OR LOWER(term) LIKE $3)
         ELSE TRUE 
       END
       ORDER BY 
         CASE 
           WHEN $1 != '' THEN
             CASE WHEN LOWER(term) LIKE $2 THEN 1 ELSE 2 END
           ELSE RANDOM()
         END,
         CASE WHEN $1 != '' THEN popularity ELSE 1 END DESC,
         CASE WHEN $1 != '' THEN LENGTH(term) ELSE 1 END ASC
       LIMIT $4`,
      [searchTerm, `${searchTerm}%`, `%${searchTerm}%`, limit],
    );

    const suggestions = result.rows.map((row) => ({
      term: row.term,
      popularity: row.popularity,
      description: row.description,
      image_src: row.image_src,
    }));

    return data<SuggestionResponse>({
      suggestions,
      query: searchTerm,
    });
  } catch (error) {
    console.error("Database error:", error);
    return data(
      {
        suggestions: [],
        error: "Failed to fetch suggestions",
      },
      { status: 500 },
    );
  }
}

export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const term = formData.get("term") as string;

  if (!term) {
    return data({ error: "Term is required" }, { status: 400 });
  }

  try {
    // Increment popularity when a term is actually searched
    await db.query("SELECT increment_popularity($1)", [term.trim()]);
    return data({ success: true });
  } catch (error) {
    console.error("Error updating popularity:", error);
    return data({ error: "Failed to update popularity" }, { status: 500 });
  }
}
