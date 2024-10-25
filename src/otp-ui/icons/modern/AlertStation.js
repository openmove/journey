import React from "react";


const  AlertStation = ({ title,img, width = "100%", height="100%", ...props }) => (
  <img
    alt={title ? <title>{title}</title> : "Events Icon"}
    height={height}
    width={width}
    src={ img || 'images/0.png'} //todo fallback
    {...props}
  />
);



export default AlertStation;
