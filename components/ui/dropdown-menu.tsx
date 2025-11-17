"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  align?: "start" | "center" | "end"
  className?: string
  children: React.ReactNode
}

interface DropdownMenuCheckboxItemProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  children: React.ReactNode
}

interface DropdownMenuItemProps {
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
    })
  }

  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  )
}

export function DropdownMenuContent({
  align = "end",
  className = "",
  children,
}: DropdownMenuContentProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-2 rounded-md border border-gray-200 bg-white shadow-lg ${alignmentClasses[align]} ${className}`}
    >
      <div className="py-1">{children}</div>
    </div>
  )
}

export function DropdownMenuCheckboxItem({
  checked = false,
  onCheckedChange,
  className = "",
  children,
}: DropdownMenuCheckboxItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onCheckedChange?.(!checked)
  }

  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      <span>{children}</span>
      {checked && <Check className="h-4 w-4 text-gray-900" />}
    </button>
  )
}

export function DropdownMenuItem({ onClick, className = "", children }: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext)

  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }

  return (
    <button
      type="button"
      className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
