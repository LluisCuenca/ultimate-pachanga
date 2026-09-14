import { cn } from '@/lib/utils'

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('brand-crest', className)}>
      <img
        src={`${import.meta.env.BASE_URL}ultimate-pachangas.png`}
        alt="Ultimate Pachangas"
      />
    </span>
  )
}
