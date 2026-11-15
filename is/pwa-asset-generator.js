// Renders and downloads every PWA icon plus og-image.png. Called by the Icons tab.
window.exportAll=function(logo,toast){
 const jobs=[];
 [72,96,128,144,152,192,384,512].forEach(s=>jobs.push([`icon-${s}.png`,s,0]));
 [192,512].forEach(s=>jobs.push([`icon-maskable-${s}.png`,s,1]));
 jobs.push(["apple-touch-icon.png",180,0],["favicon-16x16.png",16,0],["favicon-32x32.png",32,0]);
 const save=(name,c)=>c.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)},"image/png");
 jobs.forEach(([n,s,m],i)=>setTimeout(()=>{const c=document.createElement("canvas");c.width=c.height=s;logo(c,s,m);save(n,c)},i*250));
 setTimeout(()=>{const c=document.createElement("canvas");c.width=1200;c.height=630;const x=c.getContext("2d");x.fillStyle="#0B0F19";x.fillRect(0,0,1200,630);
  const l=document.createElement("canvas");l.width=l.height=340;logo(l,340,0);x.drawImage(l,80,145);
  x.fillStyle="#fff";x.font="bold 84px Trebuchet MS,sans-serif";x.fillText("Kuya Driver AI",460,280);
  x.fillStyle="#FCD116";x.font="36px Trebuchet MS,sans-serif";x.fillText("Calculator at dashboard ng Pinoy driver",460,350);
  x.fillStyle="#CE1126";x.fillRect(460,390,220,10);save("og-image.png",c)},jobs.length*250);
 toast("Dina-download ang mga icon. Ilagay sa icons/ folder.");
};
