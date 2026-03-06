import { tabs } from "../../constants/app-data";
import { iconMap } from "../../constants/icon-map";

function TabBar({ path, navigate }) {
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          onClick={() => navigate(tab.path)}
          className={`tab-btn ${path === tab.path ? "active" : ""}`}
        >
          <span className="tab-icon">{iconMap[tab.icon]}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default TabBar;
