import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const BackLink = ({ href, title }: { href: string; title: string }) => {
  return (
    <Link
      href={href}
      className="group mb-3 -ml-1.5 inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-3 text-xs font-semibold text-ink-500 transition hover:bg-brand-50 hover:text-brand-700 sm:mb-4 sm:text-sm"
    >
      <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      <span className="truncate">{title}</span>
    </Link>
  );
};

export default BackLink;
