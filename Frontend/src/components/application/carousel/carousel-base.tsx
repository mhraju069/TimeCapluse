import { createContext, useContext, useState, useRef, useEffect } from 'react';
import './carousel-base.css';


// Carousel Context
interface CarouselContextValue {
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  currentIndex: number;
  itemCount: number;
  setItemCount: (count: number) => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a Carousel.Root');
  }
  return context;
};

// Carousel Root
interface CarouselRootProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const CarouselRoot = ({ children, className = '', orientation = 'horizontal' }: CarouselRootProps) => {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -scrollContainerRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: scrollContainerRef.current.offsetWidth,
        behavior: 'smooth',
      });
    }
  };

  // Update scroll state
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      
      setCurrentIndex(index);
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(scrollLeft < container.scrollWidth - container.offsetWidth - 1);
    };

    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <CarouselContext.Provider value={{ canScrollPrev, canScrollNext, scrollPrev, scrollNext, currentIndex, itemCount, setItemCount }}>
      <div className={`carousel-root ${className}`} ref={scrollContainerRef}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
};

// Carousel Content
interface CarouselContentProps {
  children: React.ReactNode;
  className?: string;
}

const CarouselContent = ({ children, className = '' }: CarouselContentProps) => {
  const { setItemCount } = useCarousel();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const items = contentRef.current.querySelectorAll('.carousel-item');
      setItemCount(items.length);
    }
  }, [setItemCount]);

  return (
    <div ref={contentRef} className={`carousel-content ${className}`}>
      {children}
    </div>
  );
};

// Carousel Item
interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

const CarouselItem = ({ children, className = '' }: CarouselItemProps) => {
  return (
    <div className={`carousel-item ${className}`}>
      {children}
    </div>
  );
};

// Carousel Previous Trigger
interface CarouselPrevTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const CarouselPrevTrigger = ({ children, className = '', onClick }: CarouselPrevTriggerProps) => {
  const { scrollPrev } = useCarousel();

  const handleClick = () => {
    scrollPrev();
    onClick?.();
  };

  return (
    <button className={`carousel-prev-trigger ${className}`} onClick={handleClick}>
      {children}
    </button>
  );
};

// Carousel Next Trigger
interface CarouselNextTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const CarouselNextTrigger = ({ children, className = '', onClick }: CarouselNextTriggerProps) => {
  const { scrollNext } = useCarousel();

  const handleClick = () => {
    scrollNext();
    onClick?.();
  };

  return (
    <button className={`carousel-next-trigger ${className}`} onClick={handleClick}>
      {children}
    </button>
  );
};

// Carousel Indicator
interface CarouselIndicatorProps {
  children?: React.ReactNode;
  className?: string;
  framed?: boolean;
}

const CarouselIndicator = ({ children, className = '', framed = false }: CarouselIndicatorProps) => {
  const { currentIndex, itemCount } = useCarousel();
  
  return (
    <div className={`carousel-indicator ${framed ? 'carousel-indicator--framed' : ''} ${className}`}>
      {children || (
        <div className="carousel-indicator-dots">
          {Array.from({ length: itemCount }).map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator-dot ${index === currentIndex ? 'carousel-indicator-dot--active' : ''}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Export Carousel component
export const Carousel = {
  Root: CarouselRoot,
  Content: CarouselContent,
  Item: CarouselItem,
  PrevTrigger: CarouselPrevTrigger,
  NextTrigger: CarouselNextTrigger,
  Indicator: CarouselIndicator,
};

export default Carousel;