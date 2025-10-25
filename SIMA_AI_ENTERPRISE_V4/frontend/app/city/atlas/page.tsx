'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Atlas(){
  const ref = useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const map = L.map(ref.current, { center: [23.8859, 45.0792], zoom: 5, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    fetch('/atlas/sa_cities.geojson').then(r=>r.json()).then(gj=>{
      const layer = L.geoJSON(gj, {
        onEachFeature: (f, l)=> l.bindPopup(`<b>${f.properties.name_ar}</b><br/>المناخ: ${f.properties.climate}<br/>النمط: ${f.properties.identity}`)
      }).addTo(map);
      try{ map.fitBounds(layer.getBounds()); }catch{}
      setReady(true);
    });
    return ()=>{ map.remove(); }
  },[]);
  return (<section className="card">
    <h2>City Atlas (Saudi)</h2>
    <div className="hint">{ready? 'جاهز' : 'تحميل البيانات...'}</div>
    <div className="map" ref={ref}></div>
  </section>);
}
