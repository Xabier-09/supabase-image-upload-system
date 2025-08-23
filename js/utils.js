// js/utils.js
// Helpers: image compression, DOM helpers, time utility

async function compressImageFile(file, maxWidth=1600, quality=0.75) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          URL.revokeObjectURL(url);
          resolve(compressed);
        }, 'image/jpeg', quality);
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    } catch (err) { reject(err); }
  });
}

function el(selector){ return document.querySelector(selector); }
function create(tag, props){ const e = document.createElement(tag); if(props) Object.assign(e, props); return e; }

function timeAgo(ts){
  if(!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), d = Math.floor(h/24);
  if(d>0) return d+'d';
  if(h>0) return h+'h';
  if(m>0) return m+'m';
  return s+'s';
}
