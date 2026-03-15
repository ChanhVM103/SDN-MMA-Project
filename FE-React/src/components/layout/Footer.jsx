import React from "react";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#1a1a1a", color: "#fff", marginTop: "auto", width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        .fd-footer-top {
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 32px 24px 24px;
        }
        .fd-footer-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          gap: 32px;
        }
        .fd-footer-brand-name {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .fd-footer-brand-desc {
          font-size: 12px;
          color: #888;
          line-height: 1.6;
          margin-bottom: 18px;
          max-width: 240px;
        }
        .fd-footer-socials {
          display: flex;
          gap: 10px;
        }
        .fd-social-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          color: #bbb;
        }
        .fd-social-icon:hover {
          background: #ee4d2d;
          color: #fff;
          border-color: #ee4d2d;
          transform: translateY(-2px);
        }
        .fd-footer-col-title {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #fff;
          margin-bottom: 18px;
        }
        .fd-footer-links {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .fd-footer-link {
          font-size: 12px;
          color: #888;
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .fd-footer-link:hover { color: #ee4d2d; }
        .fd-footer-newsletter {
          font-size: 12px;
          color: #888;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .fd-newsletter-form {
          display: flex;
          gap: 0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .fd-newsletter-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: none;
          outline: none;
          padding: 11px 14px;
          font-size: 13px;
          color: #fff;
          min-width: 0;
        }
        .fd-newsletter-input::placeholder { color: #555; }
        .fd-newsletter-btn {
          background: #ee4d2d;
          color: #fff;
          border: none;
          padding: 11px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .fd-newsletter-btn:hover { background: #d44027; }

        .fd-footer-bottom {
          padding: 14px 24px;
          background: #111;
        }
        .fd-footer-bottom-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .fd-footer-copy {
          font-size: 12px;
          color: #555;
        }
        .fd-footer-bottom-links {
          display: flex;
          gap: 20px;
        }
        .fd-footer-bottom-link {
          font-size: 12px;
          color: #555;
          cursor: pointer;
          transition: color 0.2s;
        }
        .fd-footer-bottom-link:hover { color: #ee4d2d; }

        @media (max-width: 900px) {
          .fd-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 600px) {
          .fd-footer-grid { grid-template-columns: 1fr; }
          .fd-footer-bottom-inner { flex-direction: column; align-items: flex-start; gap: 10px; }
        }
      `}</style>

      {/* Top section */}
      <div className="fd-footer-top">
        <div className="fd-footer-grid">

          {/* Brand column */}
          <div>
            <div className="fd-footer-brand-name">
              <span style={{ fontSize: 20 }}>🍜</span>
              FoodieHub
            </div>
            <p className="fd-footer-brand-desc">
              Connecting people with the best restaurants in their city. Fresh, fast, and local.
            </p>
            <div className="fd-footer-socials">
              {[
                { icon: "𝕏", label: "Twitter" },
                { icon: "f", label: "Facebook" },
                { icon: "📷", label: "Instagram" },
              ].map((s) => (
                <div key={s.label} className="fd-social-icon" title={s.label}>
                  {s.icon}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="fd-footer-col-title">Quick Links</div>
            <div className="fd-footer-links">
              {["About Us", "Featured Restaurants", "Become a Rider", "Partner with Us"].map((l) => (
                <span key={l} className="fd-footer-link">
                  <span style={{ color: "#ee4d2d", fontSize: 10 }}>›</span> {l}
                </span>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <div className="fd-footer-col-title">Support</div>
            <div className="fd-footer-links">
              {["Help Center", "Terms of Service", "Privacy Policy", "Refund Policy"].map((l) => (
                <span key={l} className="fd-footer-link">
                  <span style={{ color: "#ee4d2d", fontSize: 10 }}>›</span> {l}
                </span>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <div className="fd-footer-col-title">Newsletter</div>
            <p className="fd-footer-newsletter">
              Join our newsletter to get the latest updates and deals.
            </p>
            <div className="fd-newsletter-form">
              <input
                className="fd-newsletter-input"
                placeholder="Your email"
                type="email"
              />
              <button className="fd-newsletter-btn">Join</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fd-footer-bottom">
        <div className="fd-footer-bottom-inner">
          <span className="fd-footer-copy">© 2024 FoodieHub Delivery Service. All rights reserved.</span>
          <div className="fd-footer-bottom-links">
            <span className="fd-footer-bottom-link">Privacy</span>
            <span className="fd-footer-bottom-link">Terms</span>
            <span className="fd-footer-bottom-link">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
