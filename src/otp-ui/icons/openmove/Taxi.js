
import React from "react";

const Taxi = ({ title, width = 26, height = 22, ...props }) => (
<svg
  width={width}
  height={height}
  id="Layer_1"
  data-name="Layer 1"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 122.88 105.19"
  {...props}
 >
 {/* https://uxwing.com/license/  */}
  <title>taxi-cab</title>
  <path fillRule="evenodd" d="M10.17,55.2c-11-5.58-9.72-11.8,1.31-11.15L14,48.68,19,32.85c1.66-5.18,4.25-10,8.83-11.42V5.57A5.58,5.58,0,0,1,33.44,0h56A5.58,5.58,0,0,1,95,5.57V21h1c6.53,0,10.29,5.54,11.87,11.87l3.82,15.35,2.2-4.14c11.34-.66,12.35,5.93.35,11.62l2,3c7.89,8.11,7.15,16.21,5.92,36.24v6.58a3.72,3.72,0,0,1-3.71,3.71H102.57a3.72,3.72,0,0,1-3.71-3.71v-3H24v3a3.72,3.72,0,0,1-3.71,3.71H4.5a3.72,3.72,0,0,1-3.71-3.71V92.93a5.46,5.46,0,0,1,0-.58C-.37,77-2.06,63.12,10.17,55.2ZM39.57,21h5V9.75h3.66v-4H35.91v4h3.66V21Zm8.73,0h5.31l.46-2h4.16l.46,2H64l-4-15.25h-7.8L48.3,21ZM65,21h5.34L72,17h.23l1.68,4h5.59l-3.28-7.63,3.51-7.62H74.24L72.5,9.93h-.25L70.51,5.72H64.78l3.43,7.77L65,21Zm16.92,0h5V5.72h-5V21Zm7.72,6.23H33.06c-5,0-7.52,4.31-9,9.05L19.23,52.17v0h86.82l-3.83-15.92c-1-4.85-4.07-9-9-9ZM56,10.56,55,15H57.3l-1-4.42ZM30.38,73.43,16.32,71.66c-3.32-.37-4.21,1-3.08,3.89l1.52,3.69a5.33,5.33,0,0,0,1.9,2.12,6.43,6.43,0,0,0,3.15.87l12.54.1c3,0,4.34-1.22,3.39-4a6.78,6.78,0,0,0-5.36-4.9Zm62.12,0,14.06-1.77c3.32-.37,4.21,1,3.08,3.89l-1.52,3.69a5.33,5.33,0,0,1-1.9,2.12,6.43,6.43,0,0,1-3.15.87l-12.54.1c-3,0-4.34-1.22-3.39-4a6.78,6.78,0,0,1,5.36-4.9Z"/>
</svg>);

export default Taxi;