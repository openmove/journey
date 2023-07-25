import React from "react";

const RoutesIcon = ({ title, width = 26, height = 22, iconColor = '#000', ...props }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M49 8a7 7 0 0 0-7 6.91C42 21.81 49 25 49 25s7-3.19 7-10.09A7 7 0 0 0 49 8zm0 9.88a2.94 2.94 0 1 1 3-2.94 3 3 0 0 1-3 2.94zM8 56l2.11-7L8 42l13 7-13 7zM49 28H25a1 1 0 0 1 0-2h24a1 1 0 0 1 0 2zM47.5 50H36a1 1 0 0 1 0-2h11.5a4.5 4.5 0 0 0 0-9H47a1 1 0 0 1 0-2h.5a6.5 6.5 0 0 1 0 13zM30 50h-6a1 1 0 0 1 0-2h6a1 1 0 0 1 0 2zM41 39H16.5a6.5 6.5 0 1 1 0-13H19a1 1 0 0 1 0 2h-2.5a4.5 4.5 0 0 0 0 9H41a1 1 0 0 1 0 2z" />
  <circle cx="22" cy="27" r="3" />
  <circle cx="44" cy="38" r="3" />
  <circle cx="33" cy="49" r="3" />
</svg>)

export default RoutesIcon;
