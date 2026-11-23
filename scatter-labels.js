// Position labels using their rendered text bounds, after localization.
function labelScatter(svg, marks, bounds) {
  requestAnimationFrame(() => {
    if (!svg.isConnected) return;
    const occupied = marks.map(({x,y,r})=>({left:x-r-2,right:x+r+2,top:y-r-2,bottom:y+r+2}));
    for (const {x,y,r,label} of marks) {
      const box=label.getBBox(), w=box.width, h=box.height;
      let best=null, score=Infinity;
      for (let top=bounds.top; top+h<=bounds.bottom; top+=4) {
        for (let left=bounds.left; left+w<=bounds.right; left+=4) {
          const right=left+w, bottom=top+h;
          const overlap=occupied.reduce((sum,b)=>sum+Math.max(0,Math.min(right,b.right)-Math.max(left,b.left))*Math.max(0,Math.min(bottom,b.bottom)-Math.max(top,b.top)),0);
          const cost=overlap*10000+Math.hypot(x-left-w/2,y-top-h/2);
          if(cost<score){score=cost;best={left,right,top,bottom};}
        }
      }
      if(!best) continue;
      label.setAttribute("x",best.left-box.x);
      label.setAttribute("y",best.top-box.y);
      occupied.push({left:best.left-2,right:best.right+2,top:best.top-2,bottom:best.bottom+2});
      const endX=Math.max(best.left,Math.min(best.right,x)),endY=Math.max(best.top,Math.min(best.bottom,y));
      const distance=Math.hypot(endX-x,endY-y);
      if(distance>r+6){
        const line=document.createElementNS(svg.namespaceURI,"line");
        Object.entries({x1:x+(endX-x)*r/distance,y1:y+(endY-y)*r/distance,x2:endX,y2:endY,stroke:"#a39ba9","stroke-width":.7,"pointer-events":"none"}).forEach(([key,value])=>line.setAttribute(key,value));
        svg.insertBefore(line,label);
      }
    }
  });
}
