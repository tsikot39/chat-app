import React, { memo, lazy, Suspense } from "react";
import { logger } from "@/lib/logger";

interface LazyComponentProps {
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}

const LazyLoadingBoundary = memo<LazyComponentProps>(({ fallback = <div>
      Loading...
    </div>, error = <div>Error loading component</div>, children }) => {
  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={error}>{children}</ErrorBoundary>
    </Suspense>
  );
});

LazyLoadingBoundary.displayName = "LazyLoadingBoundary";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("Component error boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Lazy loading utilities
export const createLazyComponent = <T extends Record<string, unknown>>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  displayName?: string
) => {
  const LazyComponent = lazy(importFn);
  if (displayName) {
    LazyComponent.displayName = displayName;
  }
  return LazyComponent;
};

// Image lazy loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo<LazyImageProps>(
  ({
    src,
    alt,
    placeholder = "/images/placeholder.png",
    onLoad,
    onError,
    ...props
  }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    const handleLoad = React.useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    const handleError = React.useCallback(() => {
      setHasError(true);
      onError?.();
      logger.warn("Image failed to load", { src, alt });
    }, [onError, src, alt]);

    return (
      <img
        ref={imgRef}
        src={isInView ? (hasError ? placeholder : src) : placeholder}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: isLoaded ? 1 : 0.5,
          transition: "opacity 0.3s ease",
          ...props.style,
        }}
        {...props}
      />
    );
  }
);

LazyImage.displayName = "LazyImage";

export { LazyLoadingBoundary };
