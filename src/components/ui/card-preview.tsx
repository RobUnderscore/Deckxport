import * as React from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CardPreviewProps {
  imageUrl?: string
  cardName: string
  children: React.ReactNode
  className?: string
}

export function CardPreview({ imageUrl, cardName, children, className }: CardPreviewProps) {
  const [showPreview, setShowPreview] = React.useState(false)
  const [showFullScreen, setShowFullScreen] = React.useState(false)
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  // Helper function to convert small image URL to large
  const getLargeImageUrl = (url?: string) => {
    if (!url) return url
    return url.replace('/small/', '/large/')
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!imageUrl) return
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Show preview after a short delay to prevent flickering
    timeoutRef.current = setTimeout(() => {
      setShowPreview(true)
      setMousePosition({ x: e.clientX, y: e.clientY })
    }, 300)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showPreview) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before preview shows
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setShowPreview(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!imageUrl) return
    e.preventDefault()
    e.stopPropagation()
    setShowFullScreen(true)
    setShowPreview(false)
  }

  // Calculate preview position to keep it on screen
  const getPreviewStyle = () => {
    const offset = 20
    const previewWidth = 336 // 21rem
    const previewHeight = 468 // approximate card height at 21rem width
    
    let left = mousePosition.x + offset
    let top = mousePosition.y - previewHeight / 2

    // Keep preview on screen horizontally
    if (left + previewWidth > window.innerWidth) {
      left = mousePosition.x - previewWidth - offset
    }

    // Keep preview on screen vertically
    if (top < 10) {
      top = 10
    } else if (top + previewHeight > window.innerHeight - 10) {
      top = window.innerHeight - previewHeight - 10
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    }
  }

  // Get the large version of the image URL for previews
  const largeImageUrl = getLargeImageUrl(imageUrl)

  return (
    <>
      <span
        className={cn("cursor-pointer", className)}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </span>

      {/* Hover Preview */}
      {showPreview && largeImageUrl && (
        <div
          className="fixed z-50 pointer-events-none"
          style={getPreviewStyle()}
        >
          <div className="bg-background border-2 border-border rounded-lg shadow-2xl overflow-hidden">
            <img
              src={largeImageUrl}
              alt={cardName}
              className="w-[21rem] h-auto"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={showFullScreen} onOpenChange={setShowFullScreen}>
        <DialogContent className="max-w-[672px] p-0 overflow-hidden">
          <img
            src={largeImageUrl}
            alt={cardName}
            className="w-full h-auto"
            loading="lazy"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}