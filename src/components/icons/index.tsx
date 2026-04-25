import type { SVGProps } from 'react'

function iconClass(className?: string) {
  return `h-5 w-5 shrink-0 ${className ?? ''}`
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M8 7V5m8 2V5m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5H4V5zM14 4h4a1 1 0 011 1v3h-6V4zM4 13h6v7H5a1 1 0 01-1-1v-6zm8 0h8v6a1 1 0 01-1 1h-7v-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9 11a4 4 0 100-8 4 4 0 000 8zm10 1v-1a4 4 0 00-3-3.87M21 13v4a2 2 0 01-2 2h-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconClipboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Crew / team */
export function IconTeam(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 20v-1a4 4 0 014-4h1M14 20v-1a3 3 0 013-3h1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.43 14.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.02-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.38.96a7.4 7.4 0 00-1.7-.98L14.6 4.7a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.6.24-1.17.57-1.7.98l-2.38-.96a.5.5 0 00-.6.22L2.8 10.8a.5.5 0 00.12.64l2.02 1.58a7.38 7.38 0 000 1.96l-2.02 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.38-.96c.53.41 1.1.74 1.7.98l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.6-.24 1.17-.57 1.7-.98l2.38.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.02-1.58z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconAlertTriangle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M12 9v4M12 17h.01M10.29 3.86L2.82 18a1 1 0 00.86 1.5h16.64a1 1 0 00.86-1.5L13.71 3.86a1 1 0 00-1.72 0z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass(props.className)} aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
