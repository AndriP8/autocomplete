import { useState, useEffect, useRef, useCallback } from "react";
import { useFetcher } from "@remix-run/react";
import InputTerm from "./input-term";
import SuggestionResults from "./suggestion-results";
import { SuggestionResponse } from "~/routes/api.autocomplete";

interface AutocompleteProps {
  onSearch?: (term: string) => void;
  initialSuggestions: SuggestionResponse["suggestions"];
}

export default function Autocomplete({
  onSearch,
  initialSuggestions,
}: AutocompleteProps) {
  const limit = 10;
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    SuggestionResponse["suggestions"]
  >(initialSuggestions || []);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestionCache, setSuggestionCache] = useState<
    Map<string, SuggestionResponse["suggestions"]>
  >(new Map());

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher<SuggestionResponse>();
  const debounceTimeout = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        if (!searchQuery.trim().length) {
          setSuggestions([]);
          return;
        }

        if (suggestionCache.has(searchQuery)) {
          setSuggestions(suggestionCache.get(searchQuery) || []);
        } else {
          fetcher.load(
            `/?index&q=${encodeURIComponent(searchQuery)}&limit=${limit}`,
          );
        }
      }, 150);
    },
    [fetcher, suggestionCache],
  );

  // Handle fetcher data
  useEffect(() => {
    if (fetcher.data) {
      setSuggestions(fetcher.data.suggestions || []);
      const cache = new Map<string, SuggestionResponse["suggestions"]>();
      cache.set(fetcher.data.query, fetcher.data.suggestions);
      setSuggestionCache((prev) => {
        return new Map([...prev, ...cache]);
      });
      setSelectedIndex(-1);
    }
  }, [fetcher.data]);

  console.log(Object.fromEntries(suggestionCache));

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex].term);
        } else if (query.trim()) {
          handleSearch(query);
        }
        break;
      case "Escape":
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setSelectedIndex(-1);
    handleSearch(term);
  };

  // Handle search submission
  const handleSearch = async (term: string) => {
    const termValue = term.trim();
    if (termValue) {
      // Update popularity in background
      const formData = new FormData();
      formData.append("term", termValue);
      fetcher.submit(formData, {
        method: "post",
        action: "/api/autocomplete",
      });
      if (onSearch) {
        onSearch(termValue);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <InputTerm
        onSubmit={handleSubmit}
        query={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        isLoading={fetcher.state === "loading"}
        ref={inputRef}
      />
      <SuggestionResults
        suggestions={suggestions}
        onClickSuggestion={handleSuggestionClick}
        selectedIndex={selectedIndex}
      />
    </div>
  );
}
