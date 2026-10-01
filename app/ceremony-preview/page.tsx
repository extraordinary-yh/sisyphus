import { notFound } from "next/navigation";
import { CeremonyPreview } from "@/components/ceremony-preview";
export default function PreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CeremonyPreview />;
}
