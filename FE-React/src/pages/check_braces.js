const fs = require('fs');
const path = require('path');
const content = fs.readFileSync('d:\\Semester 7\\MMA301\\SDN-MMA-Project\\FE-React\\src\\pages\\RestaurantDetailPage.jsx', 'utf8');

let curly = 0;
let round = 0;
let square = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') curly++;
  if (content[i] === '}') curly--;
  if (content[i] === '(') round++;
  if (content[i] === ')') round--;
  if (content[i] === '[') square++;
  if (content[i] === ']') square--;
}

console.log(`Curly: ${curly}, Round: ${round}, Square: ${square}`);
