export function colorGradient(fadeFraction, hexColor1, hexColor2, hexColor3) {
  // https://stackoverflow.com/q/30143082
  let color1 = hexToRGB(hexColor1);
  let color2 = hexToRGB(hexColor2);
  const color3 = hexToRGB(hexColor3);
  let fade = Math.floor(fadeFraction * 100) / 100;

  // Do we have 3 colors for the gradient? Need to adjust the params.
  if (color3) {
    fade = fade * 2;

    // Find which interval to use and adjust the fade percentage
    if (fade >= 1) {
      fade -= 1;
      color1 = hexToRGB(hexColor2);
      color2 = color3;
    }
  }

  var diffRed = color2.red - color1.red;
  var diffGreen = color2.green - color1.green;
  var diffBlue = color2.blue - color1.blue;

  var gradient = {
    red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
    green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
    blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
  };

  return (
    "rgb(" + gradient.red + "," + gradient.green + "," + gradient.blue + ")"
  );
}

export function hexToRGB(hex) {
  // https://stackoverflow.com/a/28056903
  var red = parseInt(hex.slice(1, 3), 16),
    green = parseInt(hex.slice(3, 5), 16),
    blue = parseInt(hex.slice(5, 7), 16);

  return {
    red,
    green,
    blue,
  };
}
