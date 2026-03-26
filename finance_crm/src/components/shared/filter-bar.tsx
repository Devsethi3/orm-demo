// src/components/shared/filter-bar.tsx
"use client";

import { useFilters } from "@/hooks/use-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelIcon, Search } from "@hugeicons/core-free-icons";

interface FilterBarProps {
  brands: { id: string; name: string }[];
  showSource?: boolean;
  showType?: boolean;
  showSearch?: boolean;
  showPeriod?: boolean;
}

export function FilterBar({
  brands,
  showSource = false,
  showType = false,
  showSearch = false,
  showPeriod = false,
}: FilterBarProps) {
  const { filters, setFilter, clearFilters } = useFilters();
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Only trigger search on Enter key or blur — NOT on every keystroke
  const handleSearchSubmit = useCallback(() => {
    if (searchInput !== (filters.search || "")) {
      setFilter("search", searchInput || undefined);
    }
  }, [searchInput, filters.search, setFilter]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit],
  );

  const hasActiveFilters =
    filters.brandId || filters.source || filters.type || filters.search;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Brand Filter */}
      <Select
        value={filters.brandId || "all"}
        onValueChange={(v) => setFilter("brandId", v === "all" ? undefined : v)}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      {showType && (
        <Select
          value={filters.type || "all"}
          onValueChange={(v) => setFilter("type", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Source Filter */}
      {showSource && (
        <Select
          value={filters.source || "all"}
          onValueChange={(v) =>
            setFilter("source", v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
            <SelectItem value="upwork">Upwork</SelectItem>
            <SelectItem value="contra">Contra</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Period Filter */}
      {showPeriod && (
        <Select
          value={filters.period}
          onValueChange={(v) => setFilter("period", v)}
        >
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Search — triggers on Enter, not on typing */}
      {showSearch && (
        <div className="relative">
          <HugeiconsIcon
            icon={Search}
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          />
          <Input
            placeholder="Search... (Enter)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onBlur={handleSearchSubmit}
            className="w-[200px] h-9 pl-8"
          />
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchInput("");
            clearFilters();
          }}
          className="h-9"
        >
          <HugeiconsIcon icon={CancelIcon} className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
