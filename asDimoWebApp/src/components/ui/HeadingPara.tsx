// Headings Start
import "./UIStyles.css";

export const Heading1 = ({ text }: { text: string }) => (
  <h1 className="PageTitle">{text}</h1>
);
export const Heading1Light = ({ text }: { text: string }) => (
  <h1 className="PageTitle Light">{text}</h1>
);
export const Heading2 = ({ text }: { text: string }) => (
  <h2 className="Heading2">{text}</h2>
);
export const Heading3 = ({ text }: { text: string }) => (
  <h3 className="Heading3">{text}</h3>
);
export const Heading4 = ({ text, span, }: {
  text: string; span?: string; }) => (
  <h4 className="Heading4"> {text} {span && <span>{span}</span>} </h4>
);
export const Heading5 = ({ text}: {text: string;}) => (
  <h5 className="Heading5"> {text} </h5>
);
export const MiniHeading5 = ({ text}: {text: string;}) => (
  <h5 className="MiniHeading5"> {text} </h5>
);
// Headings End


// Paragraphs Start
export const Paragraph = ({ text, span }: { text: React.ReactNode; span?: string;  }) => (
  <p className="PageDescription"> {span && <span>{span}</span>} {text}</p>
);
export const ParagraphLight = ({ text }: { text: React.ReactNode }) => (
  <p className="PageDescription Light">{text}</p>
);
export const Paragraph2 = ({ text }: { text: string }) => (
  <p className="PageDescription2">{text}</p>
);
export const Paragraph3 = ({ text }: { text: string }) => (
  <p className="PageDescription3">{text}</p>
);
export const TinyPara = ({ text }: { text: string }) => (
  <p className="TinyPara">{text}</p>
);
// Paragraphs End


// List Start
type ListItem = {
  icon?: string;
  text: string;
};

type ListProps = {
  items: ListItem[];
  iconsize?: number;
  variant?: "default" | "icon";
};

export const UnorderedList = ({
  items,
  iconsize = 18,
  variant = "default",
}: ListProps) => (
  <ul className={`UnorderList ${variant}`}>
    {items.map((item, index) => (
      <li
        key={index}
        className={variant === "icon" && item.icon ? "d-flex" : ""}
      >
        {item.icon && (
          <span
            className="list-icon"
          >
            <img src={item.icon} alt="" width={iconsize} height={iconsize} />
          </span>
        )}

        <span>{item.text}</span>
      </li>
    ))}
  </ul>
);
// List End