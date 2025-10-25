'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet'; import 'leaflet/dist/leaflet.css';
export default function Atlas(){
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current) return;
    const map = L.map(ref.current, { center: [23.8859, 45.0792], zoom: 5 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    fetch('/atlas/sa_cities.geojson').then(r=>r.json()).then((gj)=>{
      const layer = L.geoJSON(gj, { onEachFeature:(f,l)=> l.bindPopup(f.properties.name_ar) }).addTo(map);
      try{ map.fitBounds(layer.getBounds()); }catch{}
    });
    return ()=>{ map.remove(); }
  },[]);
  return (<section><h2>City Atlas</h2><div style={{height:'70vh'}} ref={ref}></div></section>);
}
