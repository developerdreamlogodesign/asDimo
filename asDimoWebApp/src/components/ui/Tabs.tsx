import React, { useState } from "react";
import "./UIstyles.css";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  variant?: "default" | "underline" | "LeftSide" ;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  variant = "default",
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={`DashboardsTabs ${variant}`}>
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <div
            key={tab.label || index}
            className="TabButton"
          >
            <button
              className={`tab-btn 
                ${activeTab === index ? "active" : ""} 
                ${variant}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>

      <div className="tabs-content">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;