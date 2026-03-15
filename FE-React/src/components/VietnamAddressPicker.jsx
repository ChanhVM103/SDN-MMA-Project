import { useState, useEffect, useRef } from "react";

const API_BASE = "https://provinces.open-api.vn/api";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Lỗi tải dữ liệu địa chỉ");
  return res.json();
}

function buildAddressString({ street, ward, district, province }) {
  return [street, ward, district, province].filter(Boolean).join(", ");
}

function parseAddressString(address = "") {
  const parts = address.split(",").map(s => s.trim());
  if (parts.length === 4) {
    return { street: parts[0], ward: parts[1], district: parts[2], province: parts[3] };
  }
  if (parts.length === 3) {
    return { street: parts[0], ward: "", district: parts[1], province: parts[2] };
  }
  if (parts.length === 2) {
    return { street: parts[0], ward: "", district: "", province: parts[1] };
  }
  return { street: address, ward: "", district: "", province: "" };
}

function AddressSelect({ label, value, onChange, options, loading, disabled, placeholder }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4,
      }}>{label}</div>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled || loading}
          style={{
            width: "100%", padding: "9px 32px 9px 10px",
            border: "1px solid rgba(0,0,0,.14)", borderRadius: 4,
            fontSize: 14, color: value ? "#333" : "#aaa",
            background: disabled ? "#f9f9f9" : "#fff",
            appearance: "none", cursor: disabled ? "not-allowed" : "pointer",
            outline: "none", transition: "border-color 0.15s",
          }}
          onFocus={e => e.target.style.borderColor = "#ee4d2d"}
          onBlur={e => e.target.style.borderColor = "rgba(0,0,0,.14)"}
        >
          <option value="">{loading ? "Đang tải..." : placeholder}</option>
          {options.map(o => (
            <option key={o.code} value={o.code}>{o.name}</option>
          ))}
        </select>
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", color: "#9ca3af", fontSize: 12,
        }}>▾</span>
        {loading && (
          <span style={{
            position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
            width: 12, height: 12, border: "2px solid #f0f0f0",
            borderTop: "2px solid #ee4d2d", borderRadius: "50%",
            animation: "addrSpin 0.7s linear infinite",
            display: "inline-block",
          }} />
        )}
      </div>
    </div>
  );
}

export default function VietnamAddressPicker({ value = "", onChange, disabled = false }) {
  const parsed = useRef(parseAddressString(value));

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards]         = useState([]);

  const [selProvince, setSelProvince] = useState("");
  const [selDistrict, setSelDistrict] = useState("");
  const [selWard, setSelWard]         = useState("");
  const [street, setStreet]           = useState(parsed.current.street || "");

  const [loadingP, setLoadingP] = useState(false);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingW, setLoadingW] = useState(false);

  // Flag để tránh gọi onChange khi đang init
  const isInit = useRef(true);

  // ── STEP 1: Load tỉnh ──────────────────────────────────────
  useEffect(() => {
    setLoadingP(true);
    fetchJson(`${API_BASE}/?depth=1`)
      .then(data => {
        setProvinces(data);
        // Auto-select tỉnh nếu có giá trị ban đầu
        if (parsed.current.province) {
          const prov = data.find(p =>
            p.name.toLowerCase() === parsed.current.province.toLowerCase()
          );
          if (prov) setSelProvince(String(prov.code));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, []);

  // ── STEP 2: Load quận khi selProvince thay đổi ─────────────
  useEffect(() => {
    if (!selProvince) { setDistricts([]); setSelDistrict(""); setWards([]); setSelWard(""); return; }
    setLoadingD(true);
    fetchJson(`${API_BASE}/p/${selProvince}?depth=2`)
      .then(data => {
        const list = data.districts || [];
        setDistricts(list);
        // Auto-select quận nếu đang init và có giá trị
        if (isInit.current && parsed.current.district) {
          const dist = list.find(d =>
            d.name.toLowerCase() === parsed.current.district.toLowerCase()
          );
          if (dist) setSelDistrict(String(dist.code));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingD(false));
  }, [selProvince]);

  // ── STEP 3: Load phường khi selDistrict thay đổi ───────────
  useEffect(() => {
    if (!selDistrict) { setWards([]); setSelWard(""); return; }
    setLoadingW(true);
    fetchJson(`${API_BASE}/d/${selDistrict}?depth=2`)
      .then(data => {
        const list = data.wards || [];
        setWards(list);
        // Auto-select phường nếu đang init và có giá trị
        if (isInit.current && parsed.current.ward) {
          const ward = list.find(w =>
            w.name.toLowerCase() === parsed.current.ward.toLowerCase()
          );
          if (ward) {
            setSelWard(String(ward.code));
          }
        }
        // Init xong sau khi phường được load
        isInit.current = false;
      })
      .catch(() => { isInit.current = false; })
      .finally(() => setLoadingW(false));
  }, [selDistrict]);

  // ── Notify parent (chỉ sau khi init xong) ──────────────────
  useEffect(() => {
    if (isInit.current) return;
    const provinceName = provinces.find(p => String(p.code) === selProvince)?.name || "";
    const districtName = districts.find(d => String(d.code) === selDistrict)?.name || "";
    const wardName     = wards.find(w => String(w.code) === selWard)?.name || "";
    const full = buildAddressString({ street, ward: wardName, district: districtName, province: provinceName });
    onChange?.(full);
  }, [street, selProvince, selDistrict, selWard]);

  const handleProvinceChange = (code) => {
    isInit.current = false;
    setSelProvince(code);
    setSelDistrict("");
    setSelWard("");
    setDistricts([]);
    setWards([]);
  };

  const handleDistrictChange = (code) => {
    isInit.current = false;
    setSelDistrict(code);
    setSelWard("");
    setWards([]);
  };

  const handleWardChange = (code) => {
    isInit.current = false;
    setSelWard(code);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <AddressSelect
          label="Tỉnh / Thành phố"
          value={selProvince}
          onChange={handleProvinceChange}
          options={provinces}
          loading={loadingP}
          disabled={disabled}
          placeholder="Chọn tỉnh/thành"
        />
        <AddressSelect
          label="Quận / Huyện"
          value={selDistrict}
          onChange={handleDistrictChange}
          options={districts}
          loading={loadingD}
          disabled={disabled || !selProvince}
          placeholder="Chọn quận/huyện"
        />
        <AddressSelect
          label="Phường / Xã"
          value={selWard}
          onChange={handleWardChange}
          options={wards}
          loading={loadingW}
          disabled={disabled || !selDistrict}
          placeholder="Chọn phường/xã"
        />
      </div>

      <div>
        <div style={{
          fontSize: 11, fontWeight: 600, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4,
        }}>Số nhà, tên đường</div>
        <input
          type="text"
          value={street}
          onChange={e => setStreet(e.target.value)}
          disabled={disabled}
          placeholder="VD: 123 Đường Nguyễn Huệ"
          style={{
            width: "100%", padding: "9px 10px",
            border: "1px solid rgba(0,0,0,.14)", borderRadius: 4,
            fontSize: 14, outline: "none",
            boxSizing: "border-box",
            background: disabled ? "#f9f9f9" : "#fff",
          }}
          onFocus={e => e.target.style.borderColor = "#ee4d2d"}
          onBlur={e => e.target.style.borderColor = "rgba(0,0,0,.14)"}
        />
      </div>

      <style>{`@keyframes addrSpin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}
