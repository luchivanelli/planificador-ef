import Link from "next/link"
import { ChevronLeft } from 'lucide-react';

const BackLink = ({href, title}: {href: string, title: string}) => {
  return (
    <Link href={href} className="flex items-center mb-3 sm:mb-4 text-sm font-medium text-[#0f63ff]">
      <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
      {title}
    </Link>
  )
}

export default BackLink