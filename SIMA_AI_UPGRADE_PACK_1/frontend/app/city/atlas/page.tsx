'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function colorScale(v:number){
  const r = Math.round(255*(1-v/100));
  const g = Math.round(255*(v/100));
  return `rgb(${r},${g},120)`;
}

export default function Atlas(){
  const ref = useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const map = L.map(ref.current, { center: [23.8859, 45.0792], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);

    Promise.all([
      fetch('/atlas/identity_zones.geojson').then(r=>r.json()),
      fetch('/atlas/sa_cities.geojson').then(r=>r.json()),
      fetch('http://localhost:8080/v1/metrics/cities', {headers: {'Authorization': 'Bearer '+ (localStorage.getItem('token')||'')}}).then(r=>r.json()).catch(()=>({cities:[]}))
    ]).then(([zones, cities, kpis])=>{
      const passMap = new Map<string, number>();
      (kpis?.cities||[]).forEach((c:any)=> passMap.set(c.city, c.pass_rate));

      const zonesLayer = L.geoJSON(zones, {
        style: (f:any)=> {
          const pr = f.properties.pass_rate ?? 50;
          return {color:'#666', weight:1, fillOpacity:.5, fillColor: colorScale(pr)};
        },
        onEachFeature: (f:any,l:any)=> l.bindPopup(`<b>${f.properties.name}</b><br/>Pass Rate: ${f.properties.pass_rate||0}%`)
      }).addTo(map);

      const cityLayer = L.geoJSON(cities, {
        pointToLayer: (feature:any, latlng:any)=> {
          const name = feature.properties.name_ar || feature.properties.name || 'مدينة';
          const pr = passMap.get(name) ?? (feature.properties.pass_rate || 50);
          return L.circleMarker(latlng, { radius: 6, weight:1, color:'#333', fillColor: colorScale(pr), fillOpacity:.9 })
            .bindPopup(`<b>${name}</b><br/>Pass Rate: ${pr}%<br/>الهوية: ${feature.properties.identity||'-'}`);
        }
      }).addTo(map);

      try{ map.fitBounds(zonesLayer.getBounds()); }catch{}
      // Legend
      const legend = L.control({position:'bottomright'});
      (legend as any).onAdd = function(){
        const div = L.DomUtil.create('div','info legend');
        div.style.background='white'; div.style.padding='8px'; div.style.borderRadius='8px'; div.style.boxShadow='0 2px 8px rgba(0,0,0,.15)';
        div.innerHTML = '<b>PASS Rate</b><br/>' +
          [0,20,40,60,80].map((s,i)=>{
            const v = s+10;
            return `<i style="background:${colorScale(v)};width:14px;height:14px;display:inline-block;margin-right:6px;border:1px solid #999"></i>${s}–${s+20}%<br/>`;
          }).join('');
        return div;
      };
      legend.addTo(map);

      setReady(true);
    });
    return ()=>{ map.remove(); }
  },[]);
  return (<section className="card">
    <h2>City Atlas — Choropleth (KPIs)</h2>
    <div className="map" ref={ref} style={{height:'70vh', borderRadius:'12px'}}/>
  </section>);
}
