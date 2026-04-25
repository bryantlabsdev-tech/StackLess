/**
 * Photo markup model — extend with new tool types (text, arrows, shapes) later.
 */
export type MarkupToolId = 'brush'

export interface BrushStroke {
  tool: 'brush'
  points: number[]
  stroke: string
  strokeWidth: number
}

export type MarkupStroke = BrushStroke
