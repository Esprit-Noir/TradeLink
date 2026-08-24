import React from 'react'
import {
  MousePointer2,
  TrendingUp,
  Minus,
  AlignJustify,
  Square,
  Type,
  Trash2,
  List
} from 'lucide-react'

export type DrawingToolType = 'cursor' | 'TrendLine' | 'HorizontalLine' | 'ParallelChannel' | 'FibRetracement' | 'Rectangle' | 'TextAnnotation'

interface DrawingToolbarProps {
  activeTool: DrawingToolType
  onToolChange: (tool: DrawingToolType) => void
  onClearAll: () => void
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ activeTool, onToolChange, onClearAll }) => {
  const tools: { id: DrawingToolType; icon: React.ReactNode; tooltip: string }[] = [
    { id: 'cursor', icon: <MousePointer2 size={16} />, tooltip: 'Cursor (Drag & Zoom)' },
    { id: 'TrendLine', icon: <TrendingUp size={16} />, tooltip: 'Trend Line' },
    { id: 'HorizontalLine', icon: <Minus size={16} />, tooltip: 'Horizontal Line' },
    { id: 'ParallelChannel', icon: <AlignJustify size={16} />, tooltip: 'Parallel Channel' },
    { id: 'FibRetracement', icon: <List size={16} />, tooltip: 'Fibonacci Retracement' },
    { id: 'Rectangle', icon: <Square size={16} />, tooltip: 'Rectangle / Zone' },
    { id: 'TextAnnotation', icon: <Type size={16} />, tooltip: 'Text Annotation' },
  ]

  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 bg-[var(--background)]/90 backdrop-blur-md border border-[var(--color-border)] rounded-[8px] p-1 shadow-sm">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={tool.tooltip}
          className={`p-1.5 rounded-md transition-colors flex justify-center ${
            activeTool === tool.id 
              ? "bg-[var(--color-brand)] text-white" 
              : "text-[var(--color-gray-500)] hover:bg-[var(--color-gray-100)] dark:hover:bg-[var(--color-gray-800)] hover:text-[var(--color-gray-900)] dark:hover:text-[var(--color-gray-100)]"
          }`}
        >
          {tool.icon}
        </button>
      ))}
      
      <div className="h-px bg-[var(--color-border)] my-1" />
      
      <button
        onClick={onClearAll}
        title="Clear All Drawings"
        className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors flex justify-center"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
