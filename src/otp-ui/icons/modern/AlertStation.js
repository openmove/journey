import React from "react";


const  AlertStation = ({ title,img, width = "100%", height="100%", ...props }) => (
  <img
    alt={title ? <title>{title}</title> : "Hopr Icon"}
    height={height}
    width={width}
    src={'http://127.0.0.1:5500/events/'+ (img || 'images/0.png')}
    {...props}
  />
);



export default AlertStation;
