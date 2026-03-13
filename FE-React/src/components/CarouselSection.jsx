import React, { useRef, useState, useEffect } from "react";
import RestaurantCard from "./RestaurantCard";

const CarouselSection = ({ title, restaurants, navigate }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      window.addEventListener("resize", checkScroll);
      // Extra check after potential reflow
      const timer = setTimeout(checkScroll, 500);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
      };
    }
  }, [restaurants]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      // Scroll by roughly 3 items
      const scrollAmount = (210 + 15) * 3; 
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="restaurant-section" style={{ position: "relative", marginBottom: "35px" }}>
      <div className="section-header" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        borderBottom: "4px solid var(--shopee-orange)", 
        marginBottom: "15px", 
        paddingBottom: "8px",
        margin: "0 15px"
      }}>
        <h2 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          letterSpacing: "1px", 
          margin: 0, 
          color: "var(--text-main)", 
          textTransform: "uppercase" 
        }}>{title}</h2>
        <span className="see-more" style={{ 
          fontSize: "13px", 
          color: "var(--shopee-orange)", 
          cursor: "pointer", 
          fontWeight: "500" 
        }}>Xem thêm &gt;</span>
      </div>

      <div style={{ position: "relative", overflow: "visible" }} className="carousel-container">
        {/* Left Arrow */}
        <button 
          onClick={() => scroll("left")}
          className={`nav-arrow left ${showLeftArrow ? 'visible' : ''}`}
          style={{
            position: "absolute",
            left: "-22px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            opacity: showLeftArrow ? 1 : 0,
            visibility: showLeftArrow ? "visible" : "hidden",
            color: "var(--shopee-orange)"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          className="horizontal-scroll hide-scrollbar" 
          style={{ 
            display: "flex", 
            overflowX: "auto", 
            gap: "15px", 
            padding: "10px 15px 20px 15px", 
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {restaurants.map((restaurant) => (
            <div 
              key={restaurant._id || restaurant.id} 
              style={{ 
                minWidth: "205px", 
                flex: "0 0 205px", 
                scrollSnapAlign: "start",
                transition: "transform 0.3s ease"
              }}
              className="carousel-item"
            >
              <RestaurantCard restaurant={restaurant} navigate={navigate} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => scroll("right")}
          className={`nav-arrow right ${showRightArrow ? 'visible' : ''}`}
          style={{
            position: "absolute",
            right: "-22px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: "white",
            border: "1px solid var(--border-color)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.3s ease",
            opacity: showRightArrow ? 1 : 0,
            visibility: showRightArrow ? "visible" : "hidden",
            color: "var(--shopee-orange)"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .nav-arrow:hover {
          background-color: var(--shopee-orange) !important;
          color: white !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
        .carousel-item:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
};

export default CarouselSection;
