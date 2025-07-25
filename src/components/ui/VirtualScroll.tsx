import React, { memo, useMemo } from "react";
import { performanceMonitor } from "@/lib/performance";
import { logger } from "@/lib/logger";

interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualScroll = memo<VirtualScrollProps>(
  ({ items, itemHeight, containerHeight, renderItem, overscan = 5 }) => {
    const [scrollTop, setScrollTop] = React.useState(0);

    const { visibleItems, startIndex, endIndex, totalHeight } = useMemo(() => {
      const timerId = `virtual-scroll-calculation-${Date.now()}`;
      performanceMonitor.startTimer(timerId);

      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const startIdx = Math.floor(scrollTop / itemHeight);
      const endIdx = Math.min(startIdx + visibleCount + overscan, items.length);
      const visibleStartIdx = Math.max(0, startIdx - overscan);

      const visible = items
        .slice(visibleStartIdx, endIdx)
        .map((item, index) => ({
          item,
          index: visibleStartIdx + index,
          top: (visibleStartIdx + index) * itemHeight,
        }));

      const total = items.length * itemHeight;

      performanceMonitor.endTimer(timerId, "VirtualScroll", "calculation", {
        itemCount: items.length,
        visibleCount: visible.length,
      });

      return {
        visibleItems: visible,
        startIndex: visibleStartIdx,
        endIndex: endIdx,
        totalHeight: total,
      };
    }, [items, itemHeight, containerHeight, scrollTop, overscan]);

    const handleScroll = React.useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      },
      []
    );

    React.useEffect(() => {
      logger.debug("VirtualScroll render", {
        itemCount: items.length,
        visibleCount: visibleItems.length,
        startIndex,
        endIndex,
      });
    }, [items.length, visibleItems.length, startIndex, endIndex]);

    return (
      <div
        style={{
          height: containerHeight,
          overflow: "auto",
          position: "relative",
        }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          {visibleItems.map(({ item, index, top }) => (
            <div
              key={index}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

VirtualScroll.displayName = "VirtualScroll";
