import { Jimp } from 'jimp';

async function processImage() {
  const image = await Jimp.read('public/logo.bak.png');
  // Very tight crop: 660x660
  const newSize = 660;
  const offset = Math.floor((1024 - newSize) / 2);
  
  image.crop({ x: offset, y: offset, w: newSize, h: newSize });
  image.resize({ w: 1024, h: 1024 });
  
  await image.write('public/logo.png');
}
processImage();
