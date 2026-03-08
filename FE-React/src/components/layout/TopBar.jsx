import { useState, useRef, useEffect } from "react";
import { ShutterText } from "../ui/ShutterText";
import { getAllRestaurants } from "../../services/restaurant-api";

function TopBar({ user, navigate, onLogout, onSearch, searchTerm }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState(searchTerm || "");

  useEffect(() => {
    setSearchText(searchTerm || "");
  }, [searchTerm]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  const handleSearch = () => {
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(searchText.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchText.trim().length > 1) {
        try {
          const data = await getAllRestaurants({ search: searchText.trim(), limit: 5 });
          const list = Array.isArray(data) ? data : data.restaurants || [];
          setSuggestions(list.slice(0, 5));
          setShowSuggestions(true);
        } catch (error) {
          console.error("Suggestion error", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  return (
    <header className="topbar">
      <div className="topbar-content">
        <button className="brand" type="button" onClick={() => navigate("/home")}>
          <img
            src="/logo.jpg"
            alt="FoodieHub Logo"
            style={{
              height: "42px",
              width: "auto",
              borderRadius: "6px",
              objectFit: "contain",
            }}
          />
          <ShutterText
            text="FoodieHub"
            trigger="auto"
            sliceColor="#ffdd57"
            textColor="#ffffff"
            className="brand-name"
          />
        </button>

        <div className="search-bar" ref={searchContainerRef} style={{ position: "relative" }}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm món ăn, nhà hàng yêu thích..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
          />
          {searchText && (
            <button
              type="button"
              onClick={() => { setSearchText(""); if (onSearch) onSearch(""); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 8px",
                fontSize: "18px",
                color: "#999",
                display: "flex",
                alignItems: "center",
              }}
            >
              ✕
            </button>
          )}
          <button className="search-btn" type="button" onClick={handleSearch}>
            <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "white" }}>
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "45px",
              left: 0,
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: "4px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 100,
              overflow: "hidden"
            }}>
              {suggestions.map((item) => (
                <div
                  key={item._id || item.id}
                  onClick={() => {
                    setSearchText(item.name);
                    setShowSuggestions(false);
                    if (onSearch) onSearch(item.name);
                  }}
                  style={{
                    padding: "10px 15px",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#333",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                >
                  <img src={item.image || "https://cf.shopee.vn/file/vn-11134201-7qukw-lkbscl2h9e3rc4"} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{item.name}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{item.distance || "1.0 km"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="topbar-actions">
          <button className="topbar-action" type="button" onClick={() => navigate("/orders")}>
            <svg viewBox="0 0 24 24" width="24" height="24" style={{ fill: "white" }}>
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {user ? (
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                className="topbar-action user-pill"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  transition: "background-color 0.2s",
                }}
              >
                {/* User avatar circle */}
                <span style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#fff",
                }}>
                  {(user.fullName || "U").charAt(0).toUpperCase()}
                </span>
                <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.fullName || "Bạn"}
                </span>
                {/* Dropdown arrow */}
                <svg viewBox="0 0 24 24" width="14" height="14" style={{ fill: "white", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: "180px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  zIndex: 1000,
                  animation: "dropdownSlide 0.2s ease-out",
                }}>
                  {/* User info header */}
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor: "#fafafa",
                  }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>
                      {user.fullName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                      {user.email || ""}
                    </div>
                  </div>

                  {/* Profile option */}
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      color: "#333",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" style={{ fill: "#666" }}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    Tài khoản của tôi
                  </button>

                  {/* Divider */}
                  <div style={{ height: "1px", backgroundColor: "#f0f0f0" }}></div>

                  {/* Logout option */}
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "14px",
                      color: "#ee4d2d",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fff5f4"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" style={{ fill: "#ee4d2d" }}>
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="topbar-action" type="button" onClick={() => navigate("/sign-up")}>
                Đăng ký
              </button>
              <div style={{ height: "16px", width: "1px", backgroundColor: "rgba(255,255,255,0.4)", margin: "0 8px" }}></div>
              <button className="topbar-action" type="button" onClick={() => navigate("/sign-in")}>
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
