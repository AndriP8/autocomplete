import { useState } from "react";
import { data, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import Autocomplete from "../components/auto-complete";
import { getSearch } from "./api.autocomplete";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [{ title: "Fast Autocomplete Search" }];
};

export const loader = async ({
  request,
  params,
  context,
}: LoaderFunctionArgs) => {
  const result = await getSearch({ request, params, context });
  return data({
    ...result,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  });
};

export default function Index() {
  const { data } = useLoaderData<typeof loader>();
  const [searchResults, setSearchResults] = useState<string>("");

  const handleSearch = (term: string) => {
    setSearchResults(`Searching for: "${term}"`);
  };

  return (
    <div className="min-h-screen bg-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Fast Autocomplete Search
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start typing to see lightning-fast suggestions powered by PostgreSQL
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <Autocomplete
            onSearch={handleSearch}
            initialSuggestions={data?.suggestions || []}
          />
        </div>

        {searchResults && (
          <div className="text-center">
            <div className="inline-block bg-white px-6 py-4 rounded-lg shadow-md border border-gray-200">
              <p className="text-lg font-medium text-gray-800">
                {searchResults}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This is where your search results would appear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
