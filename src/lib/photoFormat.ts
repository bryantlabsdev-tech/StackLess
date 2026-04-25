import { format, parseISO } from 'date-fns'

/** Formats ISO timestamps for task photos and work clock times. */
export function formatPhotoTimestamp(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy · h:mm a')
  } catch {
    return iso
  }
}
