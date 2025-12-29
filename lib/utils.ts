import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期，今年省略年份
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  const currentYear = new Date().getFullYear()
  if (date.getFullYear() === currentYear) {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  return date.toLocaleDateString("zh-CN")
}
