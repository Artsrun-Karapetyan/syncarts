import { Jimp } from "jimp";

async function check() {
  const img = await Jimp.read("public/logo.bak.png");
  const edgeColor = img.getPixelColor(10, 10);
  const midColor = img.getPixelColor(256, 256);
  const centerColor = img.getPixelColor(512, 512);

  console.log("Edge:", Jimp.intToRGBA(edgeColor));
  console.log("Mid:", Jimp.intToRGBA(midColor));
  console.log("Center:", Jimp.intToRGBA(centerColor));
}
check();
