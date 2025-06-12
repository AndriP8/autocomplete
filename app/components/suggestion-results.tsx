import { SuggestionResponse } from "~/routes/api.autocomplete";
import { clsx } from "clsx";
import { SearchIcon } from "lucide-react";
import { loader } from "~/routes/_index";
import { useLoaderData } from "@remix-run/react";

type InputTermProps = {
  suggestions: SuggestionResponse["suggestions"];
  onClickSuggestion: (term: string) => void;
  selectedIndex: number;
};

export default function SuggestionResults({
  suggestions,
  onClickSuggestion,
  selectedIndex,
}: InputTermProps) {
  const { R2_PUBLIC_URL } = useLoaderData<typeof loader>();

  return (
    suggestions.length > 0 && (
      <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
          <li
            key={suggestion.term}
            onClick={() => onClickSuggestion(suggestion.term)}
            className={clsx(
              "px-4 py-3 cursor-pointer transition-colors duration-150 ",
              index === selectedIndex
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-gray-50",
              index === suggestions.length - 1
                ? ""
                : "border-b border-gray-100",
            )}
          >
            <div className="flex gap-4">
              <div className="size-6">
                <SearchIcon className="size-full text-gray-500" />
              </div>
              <div className="space-y-2">
                {suggestion.image_src && (
                  <img
                    src={`${R2_PUBLIC_URL}/${suggestion.image_src}`}
                    className="size-8 bg-white"
                    alt={suggestion.term}
                  />
                )}
                <p className="text-sm font-medium">{suggestion.term}</p>
                {suggestion.description && (
                  <p className="text-xs text-gray-500">
                    {suggestion.description}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    )
  );
}
