const mediainfo = require('node-mediainfo');
 
async function main() {
  const result = await mediainfo('./backres/onepiece_demo.mp4');
  console.log(JSON.stringify(result));
}
 
main();