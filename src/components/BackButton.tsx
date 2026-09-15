import { Link, useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
export function BackButton({
  fallback,
  label,
}: {
  fallback: string
  label: string
}) {
  const navigate = useNavigate()
  return (
    <Button asChild variant="ghost" size="sm" className="w-fit">
      <Link
        to={fallback}
        onClick={(event) => {
          if (
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !event.altKey &&
            event.button === 0 &&
            window.history.state?.idx > 0
          ) {
            event.preventDefault()
            navigate(-1)
          }
        }}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  )
}
