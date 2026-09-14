import { getMatchPhotoUrl } from '@/lib/supabase'
import type { MatchRow } from '@/types/domain'
export function toPhotoUrl(match: MatchRow): string | null {
  const url = getMatchPhotoUrl(match.photo_path)

  return url && `${url}?v=${Date.parse(match.updated_at)}`
}
