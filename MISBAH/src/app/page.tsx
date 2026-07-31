import type { Metadata } from "next";
import TemplateHome from "./template/home";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <TemplateHome />;
}
