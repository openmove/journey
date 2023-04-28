import React from "react";
/*
const VmsStation = ({ title, width = 22, height = 17, iconColor = '#000', ...props }) => (
<svg width="42" height="50" viewBox="0 0 42 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="42" height="39" rx="5" fill="#000000"/>
<rect x="21.0208" y="25" width="18" height="17" rx="2" transform="rotate(45 21.0208 25)" fill="#000000"/>
<path d="M30.4397 19.9131L27.4964 24.4673L22.9185 21.4641L21.2486 24.3445L14.0796 24.9758V30H10V17.0038H14.0796V21.7143L19.3041 21.2546L20.2247 19.6894L13.9601 15.5756L19.4938 7L36 17.839L30.4397 19.9131ZM28.6669 25.2314L30.8059 26.6362L33.7046 22.1445L31.5656 20.7397L28.6669 25.2314Z" fill="white"/>
</svg>

); */


const  VmsStation = ({ title,img, ...props }) => (
  <img
    alt={title ? <title>{title}</title> : "Hopr Icon"}
    height="100%"
    width="100%"
    src={'http://localhost:5500/tests/vms/static/'+ (img || 'images/0.png')}
    {...props}
  />
);



export default VmsStation;
