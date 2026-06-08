import { Jimp } from 'jimp';

async function check() {
  const img = await Jimp.read('public/logo.bak.png');
  let minX = img.bitmap.width, minY = img.bitmap.height, maxX = 0, maxY = 0;
  
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx+1];
    const b = this.bitmap.data[idx+2];
    
    // threshold
    if (Math.max(r,g,b) > 30) { // change threshold to see where the glow starts
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  console.log('Threshold 30:', { minX, minY, maxX, maxY });

  minX = img.bitmap.width; minY = img.bitmap.height; maxX = 0; maxY = 0;
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx+1];
    const b = this.bitmap.data[idx+2];
    if (Math.max(r,g,b) > 50) { 
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  console.log('Threshold 50:', { minX, minY, maxX, maxY });

  minX = img.bitmap.width; minY = img.bitmap.height; maxX = 0; maxY = 0;
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx+1];
    const b = this.bitmap.data[idx+2];
    if (Math.max(r,g,b) > 80) { 
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  });
  console.log('Threshold 80:', { minX, minY, maxX, maxY });
}
check();
