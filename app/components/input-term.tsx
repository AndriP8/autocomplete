import { forwardRef } from "react";

type InputTermProps = {
  onSubmit: (event: React.FormEvent) => void;
  query: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  ref: React.RefObject<HTMLInputElement>;
};

const InputTerm = forwardRef<HTMLInputElement, Omit<InputTermProps, "ref">>(
  function InputTerm({ onSubmit, onChange, onKeyDown, query, isLoading }, ref) {
    return (
      <form onSubmit={onSubmit} className="relative">
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => onChange(e)}
          onKeyDown={(e) => onKeyDown(e)}
          placeholder="Try typing 'javascript', 'react', or 'python'..."
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-label="Search"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </form>
    );
  },
);

export default InputTerm;
