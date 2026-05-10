import type { ReactNode } from "react";
import SEOHead from "@/components/SEOHead";

/** Wraps private routes with noindex, leaving page contents untouched. */
export default function PrivateRoute({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SEOHead noindex title={title} />
      {children}
    </>
  );
}
