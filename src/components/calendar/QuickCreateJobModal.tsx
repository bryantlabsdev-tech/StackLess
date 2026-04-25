import type { ComponentProps } from 'react'
import { JobModal } from '../jobs/JobModal'

/** Same job form as elsewhere — opened from calendar day clicks for quick scheduling. */
export function QuickCreateJobModal(props: ComponentProps<typeof JobModal>) {
  return (
    <JobModal
      {...props}
      newJobTitle={props.newJobTitle ?? 'Schedule a job'}
      newJobDescription={
        props.newJobDescription ??
        'Starts on the date you picked on the calendar. Add the customer, assign crew, and save — the schedule updates instantly.'
      }
    />
  )
}
