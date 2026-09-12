import React from "react";
import "./UIstyles.css";
import { Heading4, Paragraph3 } from "./HeadingPara";
import {ArrowRightIcon} from 'lucide-animated';
import {basename} from "../../api/config";

interface MiniCardProps {
  image: string;
  title: string;
  description: string;
  buttonLink: string;
  total: string;
}

const MiniCard: React.FC<MiniCardProps> = ({
  image,
  title,
  description,
  buttonLink,
  total,
}) => {
  return (
    <div className="mini-card">
      <div className="mini-card-image">
        <img src={image} alt={title} />
      </div>

      <div className="mini-card-content">
        <Paragraph3 text={description}/>
        <Heading4 text={title} span={`(${total})`} />
        <a
          href={basename + buttonLink}
          className="mini-card-button d-flex"
          rel="noopener noreferrer"
        >
          View All <ArrowRightIcon size={17}/>
        </a>
      </div>
    </div>
  );
};

export default MiniCard;