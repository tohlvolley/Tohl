import * as T from './assets/vendor/three.module.js';
const material=(color,metalness=0)=>new T.MeshStandardMaterial({color,metalness,roughness:.65});
export function extraItem(kind,g){
 const cream=material('#e5d9b7'),steel=material('#a8b4b6',.7),black=material('#292d33'),wood=material('#9c683f'),blue=material('#3e6482'),red=material('#ae4d3e');
 const mesh=(geo,mat,x=0,y=0,z=0,parent=g)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;},box=(w,h,d,mat,x=0,y=0,z=0,p=g)=>mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,p),cyl=(r,h,mat,x=0,y=0,z=0,p=g)=>mesh(new T.CylinderGeometry(r,r,h,20),mat,x,y,z,p),ring=(r,t,mat,x,y,z,p=g)=>mesh(new T.TorusGeometry(r,t,8,24),mat,x,y,z,p),sphere=(r,mat,x,y,z)=>mesh(new T.SphereGeometry(r,16,12),mat,x,y,z),tube=(points,r,mat)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,8,false),mat);
 if(kind==='scissors'){for(const side of[-1,1]){ring(.10,.027,red,side*.12,.035,.22).rotation.x=Math.PI/2;const blade=box(.055,.025,.47,steel,side*.085,.04,-.10);blade.rotation.y=-side*.38;}cyl(.035,.045,black,0,.05,.04);}
 else if(kind==='pencil'||kind==='pen'){const p=new T.Group();g.add(p);p.position.y=.045;p.rotation.z=Math.PI/2;cyl(.035,.62,kind==='pencil'?material('#d1aa3b'):blue,0,0,0,p);if(kind==='pencil'){mesh(new T.ConeGeometry(.035,.13,6),wood,0,.375,0,p);mesh(new T.ConeGeometry(.014,.05,6),black,0,.43,0,p);cyl(.037,.08,red,0,-.35,0,p);}else{cyl(.04,.16,black,0,-.25,0,p);box(.015,.20,.018,steel,.045,-.25,0,p);mesh(new T.ConeGeometry(.03,.09,20),steel,0,.35,0,p);}}
 else if(kind==='eraser'){box(.38,.10,.20,cream,0,.06,0);box(.22,.108,.208,blue,.03,.06,0);box(.12,.004,.14,cream,.03,.116,0);}
 else if(kind==='ruler'){box(.76,.025,.13,wood,0,.025,0);for(let i=0;i<21;i++)box(.008,.004,i%5===0?.065:.03,black,-.34+i*.034,.04,-.025);}
 else if(kind==='notebook'){box(.45,.05,.6,blue,0,.04,0);box(.4,.035,.55,cream,.01,.045,0);box(.44,.008,.59,blue,0,.07,0);box(.26,.004,.12,cream,.03,.076,-.13);for(let i=0;i<8;i++)ring(.027,.009,steel,-.23,.055,-.24+i*.067).rotation.y=Math.PI/2;}
 else if(kind==='envelope'){box(.52,.018,.34,cream,0,.02,0);tube([[-.25,.032,-.16],[0,.033,.04],[.25,.032,-.16]],.003,wood);box(.06,.005,.07,red,.18,.033,.10);}
 else if(kind==='coin'){cyl(.18,.035,material('#c5a34d',.7),0,.03,0);ring(.145,.009,wood,0,.05,0).rotation.x=Math.PI/2;cyl(.045,.006,wood,0,.051,0);}
 else if(kind==='wallet'){box(.44,.10,.30,material('#543c31'),0,.06,0);box(.42,.012,.28,black,0,.115,0);box(.10,.025,.13,wood,.16,.13,.03);cyl(.02,.012,steel,.16,.15,.03);}
 else if(kind==='glasses'){for(const side of[-1,1]){ring(.115,.013,black,side*.135,.055,0).rotation.x=Math.PI/2;tube([[side*.245,.055,0],[side*.28,.06,-.27],[side*.24,.03,-.36]],.012,black);}box(.08,.018,.025,black,0,.055,0);}
 else if(kind==='mirror'){const m=cyl(.22,.035,steel,0,.06,-.12);m.scale.z=1.25;ring(.225,.018,cream,0,.085,-.12).rotation.x=Math.PI/2;box(.075,.05,.30,cream,0,.055,.20);}
 else if(kind==='comb'){box(.60,.05,.08,material('#985c37'),0,.04,-.09);for(let i=0;i<18;i++)box(.018,.045,.18,wood,-.28+i*.033,.04,.035);}
 else if(kind==='toothbrush'){box(.06,.035,.58,blue,0,.04,0);box(.095,.035,.17,cream,0,.06,-.26);for(let i=0;i<5;i++)for(let j=0;j<3;j++)cyl(.009,.065,cream,(j-1)*.025,.10,-.32+i*.03);}
 else if(kind==='spoon'||kind==='fork'){box(.045,.025,.40,steel,0,.035,.14);if(kind==='spoon'){sphere(.12,steel,0,.04,-.18).scale.set(.8,.18,1.35);}else{box(.15,.025,.08,steel,0,.035,-.10);for(let i=0;i<4;i++)box(.022,.025,.16,steel,(i-1.5)*.043,.035,-.21);}}
 else if(kind==='plate'){cyl(.32,.035,cream,0,.035,0);ring(.29,.025,cream,0,.06,0).rotation.x=Math.PI/2;ring(.22,.007,blue,0,.056,0).rotation.x=Math.PI/2;}
 else if(kind==='bowl'){const ceramic=cream.clone();ceramic.side=T.DoubleSide;mesh(new T.SphereGeometry(.25,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2),ceramic,0,.26,0);ring(.25,.015,blue,0,.26,0).rotation.x=Math.PI/2;}
 else if(kind==='apple'){sphere(.19,red,-.07,.21,0).scale.y=1.05;sphere(.19,red,.07,.21,0).scale.y=1.05;cyl(.018,.12,wood,0,.43,0);const leaf=sphere(.07,material('#4e773a'),.065,.46,0);leaf.scale.set(1.3,.15,.5);}
 else if(kind==='banana'){tube([[-.26,.16,0],[-.13,.06,.02],[.08,.06,.02],[.26,.20,0]],.075,material('#e4c64d'));for(const x of[-.27,.27])sphere(.028,wood,x,.18,0);}
 else if(kind==='candle'){cyl(.10,.38,cream,0,.21,0);cyl(.009,.045,black,0,.42,0);cyl(.18,.025,steel,0,.025,0);}
 else if(kind==='flashlight'){const p=new T.Group();g.add(p);p.rotation.z=Math.PI/2;p.position.y=.12;cyl(.075,.43,black,0,0,0,p);cyl(.115,.12,blue,0,.25,0,p);cyl(.09,.008,cream,0,.315,0,p);box(.04,.08,.02,red,0,.06,.078,p);}
 else if(kind==='camera'){box(.50,.29,.22,black,0,.17,0);const lens=cyl(.12,.16,steel,0,.18,.16);lens.rotation.x=Math.PI/2;const front=cyl(.09,.015,blue,0,.18,.25);front.rotation.x=Math.PI/2;box(.12,.07,.12,black,-.14,.35,0);box(.11,.06,.015,cream,.14,.24,.12);}
 else if(kind==='bell'){mesh(new T.CylinderGeometry(.065,.20,.27,24,1,true),material('#b49a4c',.6),0,.17,0);sphere(.045,wood,0,.045,0);cyl(.035,.18,wood,0,.38,0);}
 else if(kind==='padlock'){box(.28,.26,.14,material('#b49a4c',.5),0,.15,0);const u=ring(.10,.026,steel,0,.32,0);u.scale.y=1.3;cyl(.025,.01,black,0,.16,.075).rotation.x=Math.PI/2;}
 else if(kind==='hammer'){const h=cyl(.035,.62,wood,0,.055,.10);h.rotation.x=Math.PI/2;box(.30,.13,.14,steel,0,.09,-.23);}
 else if(kind==='screwdriver'){cyl(.065,.25,red,0,.15,0);cyl(.018,.31,steel,0,.43,0);box(.05,.075,.012,steel,0,.61,0);}
 else if(kind==='ball'){sphere(.25,material('#bd7746'),0,.26,0);for(const axis of['x','y','z']){const r=ring(.252,.007,black,0,.26,0);r.rotation[axis]=Math.PI/2;}}
 else return false;
 g.name='item-'+kind;return true;
}
