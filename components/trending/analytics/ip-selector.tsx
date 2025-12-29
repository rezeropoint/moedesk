"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { SelectedIp, SearchResultItem } from "@/types/analytics"

interface IpSelectorProps {
  selectedIps: SelectedIp[]
  onSelect: (ip: SelectedIp) => void
  onRemove: (trendingId: string) => void
  maxSelection?: number
}

export function IpSelector({
  selectedIps,
  onSelect,
  onRemove,
  maxSelection = 5,
}: IpSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/trendings/search?q=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const { data } = await res.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("搜索失败:", error)
    } finally {
      setSearching(false)
    }
  }, [])

  const handleSelect = (item: SearchResultItem) => {
    if (selectedIps.length >= maxSelection) return
    if (selectedIps.some((ip) => ip.trendingId === item.trendingId)) return

    onSelect({
      trendingId: item.trendingId,
      seriesId: item.seriesId,
      titleOriginal: item.titleOriginal,
      titleChinese: item.titleChinese,
      coverImage: item.coverImage,
      type: item.type,
    })
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedIps.map((ip) => (
          <Badge
            key={ip.trendingId}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1.5"
          >
            {ip.coverImage && (
              <Image
                src={ip.coverImage}
                alt=""
                width={16}
                height={16}
                className="rounded object-cover"
              />
            )}
            <span className="max-w-[150px] truncate">
              {ip.titleChinese || ip.titleOriginal}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemove(ip.trendingId)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {selectedIps.length < maxSelection && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-dashed"
              >
                <Search className="mr-2 h-4 w-4" />
                添加 IP
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="搜索 IP..."
                  onValueChange={handleSearch}
                />
                <CommandList>
                  {searching && (
                    <CommandEmpty>搜索中...</CommandEmpty>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <CommandEmpty>输入关键词搜索</CommandEmpty>
                  )}
                  {searchResults.length > 0 && (
                    <CommandGroup>
                      {searchResults.map((item) => {
                        const isSelected = selectedIps.some(
                          (ip) => ip.trendingId === item.trendingId
                        )
                        return (
                          <CommandItem
                            key={item.trendingId}
                            value={item.trendingId}
                            onSelect={() => handleSelect(item)}
                            disabled={isSelected}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {item.coverImage && (
                                <Image
                                  src={item.coverImage}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.titleChinese || item.titleOriginal}
                                </p>
                                {item.titleChinese && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.titleOriginal}
                                  </p>
                                )}
                              </div>
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedIps.length >= maxSelection && (
        <p className="text-xs text-muted-foreground">
          最多选择 {maxSelection} 个 IP
        </p>
      )}
    </div>
  )
}
