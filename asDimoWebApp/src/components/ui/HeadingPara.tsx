// Headings Start
import "./UIStyles.css";

export const Heading1 = ({ text }: { text: string }) => (
  <h1 className="PageTitle">{text}</h1>
);
export const Heading2 = ({ text }: { text: string }) => (
  <h2 className="Heading2">{text}</h2>
);
export const Heading3 = ({ text }: { text: string }) => (
  <h3 className="Heading3">{text}</h3>
);
// Headings End


// Paragraphs Start
export const Paragraph = ({ text }: { text: React.ReactNode }) => (
  <p className="PageDescription">{text}</p>
);
export const Paragraph2 = ({ text }: { text: string }) => (
  <p className="PageDescription2">{text}</p>
);
// Paragraphs End


// List Start
interface ListItem {
  text: string;
  icon?: React.ReactNode;
}

interface ListProps {
  items: ListItem[];
  className?: string;
  variant?: "default" | "icon";
}

export const UnorderedList = ({
  items,
  variant = "default",
}: ListProps) => (
  <ul className={`UnorderList ${variant}`}>
    {items.map((item, index) => (
      <li key={index} className={variant === "icon" && item.icon ? "d-flex" : ""}>
        {item.icon && (
          <span className="list-icon">{item.icon}</span>
        )}
        {item.text}
      </li>
    ))}
  </ul>
);
// List End