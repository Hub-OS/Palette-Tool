var e,t={};t=JSON.parse("[]");const n=document.getElementById("about-dialog"),a=document.getElementById("about-button");document.body.addEventListener("click",function(e){n==e.target||e.target&&n.contains(e.target)||e.target==a||n.close()}),a.onclick=function(){n.show()};const o=document.createElement("div");for(const n of(o.className="about-section-body",(e=t)&&e.__esModule?e.default:e)){let e=document.createElement("div");e.className="about-listing";let t=document.createElement("div");t.innerText=n.name,e.appendChild(t);let a=document.createElement("div");if(a.className="links",n.homepage){let e=document.createElement("a");e.innerText="Homepage",e.href=n.homepage,e.target="_blank",a.appendChild(e)}let d=n.licenses.map(e=>e.text).join("\n\n"+"-".repeat(80)+"\n\n"),c=document.createElement("a");c.innerText="License",c.href="javascript:void",c.onclick=function(){window.open("about:blank").document.body.innerText=d},a.appendChild(c),e.appendChild(a),o.appendChild(e)}n.appendChild(o);
//# sourceMappingURL=index.90e8d413.js.map
