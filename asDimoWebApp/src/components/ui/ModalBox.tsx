import React from "react";
import "./UIstyles.css";

interface ConfirmModalProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  onCancel?: () => void;
  showCloseButton?: boolean;
  customeClass?: string;
}

const ModalBox: React.FC<ConfirmModalProps> = ({
  header = "Are you sure?",
  body,
  onCancel,
  customeClass = "",
  showCloseButton = true,
}) => {
  return (
    <div
      className={`GlobalModalBox modalOverlay ${customeClass}`}
      onClick={onCancel}
    >
      <div
        className="modalBox"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <div>{header}</div>

          {showCloseButton && (
            <button
              type="button"
              className="modalCloseBtn"
              onClick={onCancel}
            >
              ×
            </button>
          )}
        </div>

        <div className="modalBody">
          {body}
        </div>
      </div>
    </div>
  );
};

export default ModalBox;