//icons
export { MapMarkerAlt } from "@styled-icons/fa-solid";
export MarkerCarSharing from "../../icons/modern/MarkerCarSharing";
export CarSharingIcon from "../../icons/modern/CarSharing";
export BadgeIcon from "../../icons/badge-icon";

//custom icons
import carNissanLeaf from '../../../images/car-sharing/nissan-leaf.jpg';
import carVwCaddy from '../../../images/car-sharing/vw-caddy.jpg';
import carGolfVariant from '../../../images/car-sharing/vw-golf-variant.jpg';
import carGolf from '../../../images/car-sharing/vw-golf.jpg';
import carVwUp from '../../../images/car-sharing/vw-up.jpg';
import carVwId3 from '../../../images/car-sharing/vw-id3.jpg';
import carRenaultZoe from '../../../images/car-sharing/renault-zoe.jpg';
import carPlaceholder from '../../../images/car-sharing/placeholder.png';

const carImages = {
  'defaultCar': carPlaceholder,
  'vw-golf': carGolf,
  'vw-up': carVwUp,
  'vw-golf-variant': carGolfVariant,
  'vw-caddy': carVwCaddy,
  'vw-caddy-life': carVwCaddy, //TODO create new image
  'vw-id3': carVwId3,
  'vw-egolf': carGolf,
  'vw-eup': carVwUp,
  'renault-zoe': carRenaultZoe,
  'nissan-leaf-elektro': carNissanLeaf
};

export const getCarModelImage = model => {
    return carImages[model] || carImages.defaultCar;
};

