'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function colorScale(v:number){
  const r = Math.round(255*(1-v/100));
  const g = Math.round(255*(v/100));
  return `rgb(${r},${g},100)`;
}

export default function Atlas(){
  const ref = useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(!ref.current) return;
    const map = L.map(ref.current, { center: [23.8859, 45.0792], zoom: 5, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
    Promise.all([
      fetch('/atlas/identity_zones.geojson').then(r=>r.json()),
      fetch('/atlas/sa_cities.geojson').then(r=>r.json())
    ]).then(([zones, cities])=>{
      const zonesLayer = L.geoJSON(zones, {
        style: (f)=> ({color:'#555', weight:1, fillOpacity:.5, fillColor: colorScale(f.properties.pass_rate||50)}),
        onEachFeature: (f,l)=> l.bindPopup(`<b>${f.properties.name}</b><br/>Pass Rate: ${f.properties.pass_rate||0}%`)
      }).addTo(map);
      const cityLayer = L.geoJSON(cities, {
        onEachFeature: (f, l)=> l.bindPopup(`<b>${f.properties.name_ar}</b><br/>المناخ: ${f.properties.climate}<br/>الهوية: ${f.properties.identity}`)
      }).addTo(map);
      try{ map.fitBounds(zonesLayer.getBounds()); }catch{}
      setReady(true);
    });
    return ()=>{ map.remove(); }
  },[]);
  return (<section className="card">
    <h2>City Atlas — Choropleth</h2>
    <div className="map" ref={ref}></div>
  </section>);
}
