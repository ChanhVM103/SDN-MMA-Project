import { useState, useEffect } from "react";
import { getAllRestaurants } from "../services/restaurant-api";

// Map tags với emoji và màu sắc
const CATEGORY_MAP = {
  'Pizza': { emoji: '🍕', color: '#FFEAA7' },
  'Burger': { emoji: '🍔', color: '#DFE6E9' },
  'Sushi': { emoji: '🍣', color: '#FAD9D5' },
  'Hải sản': { emoji: '🦐', color: '#E3F2FD' },
  'Salad': { emoji: '🥗', color: '#E8F5E9' },
  'Nướng': { emoji: '🍖', color: '#FFF3E0' },
  'Phở': { emoji: '🍜', color: '#FFF8E1' },
  'Hàn Quốc': { emoji: '🇰🇷', color: '#F3E5F5' },
  'Ý': { emoji: '🇮🇹', color: '#E8F5E9' },
};

// Default category cho flash sale
const FLASH_SALE_CATEGORY = { 
  id: 'flash-sale', 
  name: 'Giảm giá', 
  emoji: '🔥', 
  color: '#FFE8E0', 
  tag: 'flash-sale' 
};

function CategorySection({ onSelectCategory, activeCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllRestaurants({ limit: 500 });
        const restaurantList = Array.isArray(data) ? data : data.restaurants || [];
        
        // Extract unique tags
        const tagsSet = new Set();
        restaurantList.forEach(restaurant => {
          if (restaurant.tags && Array.isArray(restaurant.tags)) {
            restaurant.tags.forEach(tag => {
              if (CATEGORY_MAP[tag]) tagsSet.add(tag);
            });
          }
        });

        // Convert to category objects
        const categoriesArray = [
          FLASH_SALE_CATEGORY,
          ...Array.from(tagsSet).map((tag, index) => ({
            id: `cat-${index}`,
            name: tag,
            emoji: CATEGORY_MAP[tag].emoji,
            color: CATEGORY_MAP[tag].color,
            tag: tag,
          }))
        ];

        setCategories(categoriesArray.slice(0, 12));
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Fallback
        setCategories([
          FLASH_SALE_CATEGORY,
          { id: '2', name: 'Pizza', emoji: '🍕', color: '#FFEAA7', tag: 'Pizza' },
          { id: '3', name: 'Burger', emoji: '🍔', color: '#DFE6E9', tag: 'Burger' },
          { id: '4', name: 'Sushi', emoji: '🍣', color: '#FAD9D5', tag: 'Sushi' },
          { id: '5', name: 'Hải sản', emoji: '🦐', color: '#E3F2FD', tag: 'Hải sản' },
          { id: '6', name: 'Salad', emoji: '🥗', color: '#E8F5E9', tag: 'Salad' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="view-port" style={{ paddingTop: "20px", paddingBottom: "10px" }}>
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          Đang tải danh mục...
        </div>
      </section>
    );
  }

  return (
    <section className="view-port" style={{ paddingTop: "20px", paddingBottom: "10px" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "14px" 
      }}>
        <h2 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          margin: 0, 
          color: "var(--text-main)" 
        }}>
          📋 Danh mục
        </h2>
      </div>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
        gap: "14px",
      }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectCategory(cat.tag)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "transform 0.2s",
              opacity: activeCategory === cat.tag ? 1 : 0.75,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: cat.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              boxShadow: activeCategory === cat.tag 
                ? "0 4px 12px rgba(238, 77, 45, 0.3)" 
                : "0 2px 8px rgba(0,0,0,0.08)",
              border: activeCategory === cat.tag ? "2px solid var(--shopee-orange)" : "none",
            }}>
              {cat.emoji}
            </div>
            <span style={{
              fontSize: "13px",
              fontWeight: activeCategory === cat.tag ? "600" : "500",
              color: activeCategory === cat.tag ? "var(--shopee-orange)" : "var(--text-main)",
              textAlign: "center",
              lineHeight: "1.2",
            }}>
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategorySection;
