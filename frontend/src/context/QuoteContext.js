import { createContext, useContext, useState } from "react";
import QuoteModal from "@/components/QuoteModal";
import { trackClick } from "@/lib/track";

const QuoteContext = createContext(null);

export function QuoteProvider({ children }) {
  const [state, setState] = useState({ open: false, product: null });

  const openQuote = (product = null) => {
    trackClick("quote", { label_extra: product ? product.slug : "generico" });
    setState({ open: true, product });
  };
  const closeQuote = () => setState({ open: false, product: null });

  return (
    <QuoteContext.Provider value={{ openQuote, closeQuote }}>
      {children}
      <QuoteModal
        open={state.open}
        onClose={closeQuote}
        product={state.product}
      />
    </QuoteContext.Provider>
  );
}

export const useQuote = () => useContext(QuoteContext);