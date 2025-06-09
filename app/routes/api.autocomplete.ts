import { data, type LoaderFunctionArgs } from "@remix-run/node";
import db from "~/db";

type Suggestion = {
  term: string;
  popularity: number;
};

export type SuggestionResponse = {
  suggestions: Suggestion[];
  query: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  if (!query || query.trim().length === 0) {
    return data({ suggestions: [] });
  }

  const searchTerm = query.trim().toLowerCase();

  try {
    const result = await db.query(
      `SELECT term, popularity 
       FROM search 
       WHERE LOWER(term) LIKE $1 OR LOWER(term) LIKE $2
       ORDER BY 
         CASE WHEN LOWER(term) LIKE $1 THEN 1 ELSE 2 END,
         popularity DESC,
         LENGTH(term) ASC
       LIMIT $3`,
      [`${searchTerm}%`, `%${searchTerm}%`, limit],
    );

    const suggestions = result.rows.map((row) => ({
      term: row.term,
      popularity: row.popularity,
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
