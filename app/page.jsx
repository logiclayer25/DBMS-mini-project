"use client";

import { useMemo, useState } from "react";

const initialRequests = [
  { id: "REQ-1048", location: "East Ward", resource: "Drinking water", quantity: "300 litres", priority: "Urgent", status: "Open", time: "08:42 AM" },
  { id: "REQ-1047", location: "North Ward", resource: "Blankets", quantity: "80 pieces", priority: "High", status: "Partially Fulfilled", time: "08:16 AM" },
  { id: "REQ-1046", location: "East Ward", resource: "Food packets", quantity: "150 packets", priority: "Normal", status: "Fulfilled", time: "07:54 AM" },
  { id: "REQ-1045", location: "North Ward", resource: "First aid kits", quantity: "24 kits", priority: "Normal", status: "Open", time: "07:31 AM" },
];

const navItems = [
  ["Overview", "grid"], ["Incidents", "pulse"], ["Relief camps", "camp"],
  ["Aid requests", "box"], ["Volunteers", "people"], ["Resources", "leaf"],
];

const sectionData = {
  Incidents: { intro: "Track incident status, severity and affected communities.", columns: ["INCIDENT", "TYPE", "SEVERITY", "STARTED", "STATUS"], rows: [["River Response Demo", "Flood", "High", "14 Aug 2026 · 06:00", "Active"], ["Monsoon Watch · Demo", "Flood", "Moderate", "12 Aug 2026 · 11:30", "Monitoring"], ["Coastal Readiness · Demo", "Cyclone", "Low", "08 Aug 2026 · 09:15", "Closed"]] },
  "Relief camps": { intro: "Review shelter capacity and operating status for the active response.", columns: ["CAMP", "LOCATION", "CAPACITY", "STATUS", "INCIDENT"], rows: [["North Relief Camp", "North Ward", "600 people", "Open", "River Response Demo"], ["East Relief Camp", "East Ward", "300 people", "Open", "River Response Demo"]] },
  "Aid requests": { intro: "Prioritize incoming supply needs and track fulfillment progress.", columns: ["REQUEST", "LOCATION", "RESOURCE", "QUANTITY", "PRIORITY", "STATUS"], requestRows: true },
  Volunteers: { intro: "See the response team roster and current deployment availability.", columns: ["VOLUNTEER", "SKILL", "ASSIGNMENT", "LOCATION", "STATUS"], rows: [["Sample Volunteer One", "First aid", "Assigned", "North Relief Camp", "Assigned"], ["Sample Volunteer Two", "Logistics", "Assigned", "East Relief Camp", "Assigned"], ["Demo Volunteer Three", "Medical support", "—", "South Zone", "Available"], ["Demo Volunteer Four", "Transport", "—", "South Zone", "Available"]] },
  Resources: { intro: "Check essential stock across both active relief camps.", columns: ["RESOURCE", "CATEGORY", "UNIT", "NORTH CAMP", "EAST CAMP", "TOTAL"], rows: [["Drinking water", "Essential", "litre", "1,200", "600", "1,800"], ["Food packet", "Food", "packet", "500", "250", "750"], ["Blanket", "Shelter", "piece", "120", "60", "180"]] },
};

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    pulse: <><path d="M3 12h4l3-8 4 16 3-8h4"/><circle cx="19" cy="12" r="2"/></>,
    camp: <><path d="m3 20 9-16 9 16"/><path d="M7 14h10M10 20v-5a2 2 0 0 1 4 0v5"/></>,
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
    leaf: <><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 10-6 8-16Z"/><path d="M4 21c3-6 7-9 13-12"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    chevron: <path d="m8 10 4 4 4-4"/>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function Status({ children }) {
  const key = children.toLowerCase().replaceAll(" ", "-");
  return <span className={`status status-${key}`}><i />{children}</span>;
}

function SectionView({ name, requests, onNewRequest }) {
  const config = sectionData[name];
  if (!config) return null;
  const rows = config.requestRows ? requests.map((r) => [r.id, r.location, r.resource, r.quantity, r.priority, r.status]) : config.rows;
  return <section className="panel section-panel"><div className="section-view-head"><div><div className="eyebrow">SOUTH ZONE · RIVER RESPONSE DEMO</div><h2>{name}</h2><p>{config.intro}</p></div>{name === "Aid requests" && <button className="button button-primary" onClick={onNewRequest}><Icon name="plus" size={16}/> New aid request</button>}</div><div className="section-table-wrap"><table className="section-table"><thead><tr>{config.columns.map((col) => <th key={col}>{col}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{j === row.length - 1 && ["Active", "Monitoring", "Closed", "Open", "Partially Fulfilled", "Fulfilled", "Available", "Assigned"].includes(cell) ? <Status>{cell}</Status> : cell}</td>)}</tr>)}</tbody></table></div><div className="section-foot"><span><i/> DEMO DATA · MIRRORS THE PROJECT MYSQL TABLES</span><span>{rows.length} records shown</span></div></section>;
}

function Modal({ onClose, onCreate }) {
  const [location, setLocation] = useState("East Ward");
  const [resource, setResource] = useState("Drinking water");
  const [quantity, setQuantity] = useState(100);
  const [priority, setPriority] = useState("Normal");
  function submit(e) {
    e.preventDefault();
    onCreate({ id: `REQ-${1050 + Math.floor(Math.random() * 900)}`, location, resource, quantity: `${quantity} ${resource === "Drinking water" ? "litres" : "units"}`, priority, status: "Open", time: "Just now" });
  }
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}>
    <div className="modal-head"><div><span className="eyebrow">FIELD OPERATIONS</span><h2>Create aid request</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
    <p className="muted">Log a supply need for the active River Response incident.</p>
    <label>Location<select value={location} onChange={(e) => setLocation(e.target.value)}><option>East Ward</option><option>North Ward</option></select></label>
    <div className="form-row"><label>Resource<select value={resource} onChange={(e) => setResource(e.target.value)}><option>Drinking water</option><option>Food packets</option><option>Blankets</option><option>First aid kits</option></select></label><label>Quantity<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label></div>
    <label>Priority<select value={priority} onChange={(e) => setPriority(e.target.value)}><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select></label>
    <div className="demo-note"><Icon name="alert" size={16} /> Demo mode · This request is held in page state and is not written to MySQL.</div>
    <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit"><Icon name="plus" size={16} /> Create request</button></div>
  </form></div>;
}

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [requests, setRequests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All requests");
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const filteredRequests = useMemo(() => requests.filter((r) => `${r.id} ${r.location} ${r.resource} ${r.status}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All requests" || r.status === filter)), [requests, query, filter]);
  function createRequest(request) { setRequests((current) => [request, ...current]); setShowModal(false); setActive("Aid requests"); }

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="#overview" onClick={() => setActive("Overview")}><span className="brand-mark"><Icon name="pulse" size={21} /></span><span>relief<span className="brand-light">ops</span><small>RESPONSE CONSOLE</small></span></a>
      <div className="workspace"><span className="workspace-dot" /><span><strong>South Zone</strong><small>Operations workspace</small></span><Icon name="chevron" size={15} /></div>
      <span className="nav-label">WORKSPACE</span>
      <nav aria-label="Main navigation">{navItems.map(([label, icon]) => <button key={label} className={`nav-item ${active === label ? "nav-active" : ""}`} onClick={() => { setActive(label); setSidebarOpen(false); }}><Icon name={icon} /><span>{label}</span>{label === "Aid requests" && <b className="nav-count">{requests.filter((r) => r.status === "Open").length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="weather"><span className="weather-icon"><Icon name="sun" size={19} /></span><div><strong>32° <span>Partly cloudy</span></strong><small>Bengaluru, Karnataka</small></div></div><div className="profile"><div className="avatar">SP</div><div><strong>Seshank P.</strong><small>Field coordinator</small></div><button aria-label="Profile options"><Icon name="chevron" size={15} /></button></div></div>
    </aside>
    {sidebarOpen && <button className="mobile-shade" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}

    <main className="main-area">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><div className="breadcrumb">Operations <span>/</span> <strong>{active}</strong></div><div className="top-actions"><div className="system-status"><i /> All systems operational</div><button className="icon-button search-top" aria-label="Search" onClick={() => document.getElementById("request-search")?.focus()}><Icon name="search" /></button><button className="icon-button notification" aria-label="Notifications"><Icon name="bell" /><i /></button><div className="top-avatar">SP</div></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> LIVE RESPONSE · <span>14 AUG 2026</span></div><h1>{active === "Overview" ? "Good morning, Seshank" : active}<span>{active === "Overview" ? "Here’s your response overview." : `Monitor ${active.toLowerCase()} across the South Zone.`}</span></h1></div><div className="heading-actions"><button className="button button-quiet" onClick={() => window.print()}><Icon name="download" size={16} /> Export report</button><button className="button button-primary" onClick={() => setShowModal(true)}><Icon name="plus" size={17} /> New aid request</button></div></div>

        <div className="incident-banner"><div className="incident-icon"><Icon name="alert" size={20} /></div><div className="incident-main"><div><span className="incident-kicker">ACTIVE INCIDENT</span><Status>High</Status><span className="incident-type">Flood response</span></div><h2>River Response Demo <span>·</span> Demo District, Karnataka</h2><p><Icon name="clock" size={14} /> Started 14 Aug 2026, 06:00 AM <i /> Incident commander: Seshank P.</p></div><button className="incident-link" onClick={() => setActive("Incidents")}>View incident <Icon name="arrow" size={16} /></button></div>

        {active === "Overview" ? <><section className="metric-grid" aria-label="Response summary">
          <article className="metric-card"><div className="metric-top"><span>People affected</span><span className="metric-icon metric-coral"><Icon name="people" size={17} /></span></div><div className="metric-number">600 <span>people</span></div><div className="metric-foot"><span className="trend-up">Across 2 locations</span><span className="metric-spark coral-spark"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
          <article className="metric-card"><div className="metric-top"><span>Relief camps</span><span className="metric-icon metric-blue"><Icon name="camp" size={17} /></span></div><div className="metric-number">02 <span>active</span></div><div className="metric-foot"><span>900 total capacity</span><span className="metric-spark blue-spark"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
          <article className="metric-card"><div className="metric-top"><span>Open aid requests</span><span className="metric-icon metric-amber"><Icon name="box" size={17} /></span></div><div className="metric-number">{requests.filter((r) => r.status === "Open").length.toString().padStart(2, "0")} <span>needs action</span></div><div className="metric-foot"><span className="urgent-foot"><i /> 1 urgent priority</span><span className="metric-spark amber-spark"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
          <article className="metric-card"><div className="metric-top"><span>Volunteers deployed</span><span className="metric-icon metric-green"><Icon name="people" size={17} /></span></div><div className="metric-number">02 <span>on the ground</span></div><div className="metric-foot"><span>2 available nearby</span><span className="metric-spark green-spark"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span></div></article>
        </section>

        <section className="content-grid"><article className="panel requests-panel"><div className="panel-head"><div><div className="eyebrow">FIELD NEEDS</div><h3>Recent aid requests <span className="table-count">{requests.length}</span></h3></div><button className="text-link" onClick={() => setActive("Aid requests")}>View all <Icon name="arrow" size={15}/></button></div><div className="table-toolbar"><div className="table-search"><Icon name="search" size={16}/><input id="request-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests..." /></div><select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter requests"><option>All requests</option><option>Open</option><option>Partially Fulfilled</option><option>Fulfilled</option></select></div><div className="table-wrap"><table><thead><tr><th>REQUEST</th><th>LOCATION</th><th>RESOURCE</th><th>PRIORITY</th><th>STATUS</th></tr></thead><tbody>{filteredRequests.map((r) => <tr key={r.id}><td><strong>{r.id}</strong><small>{r.time}</small></td><td><span className="location-cell"><Icon name="pin" size={14}/>{r.location}</span></td><td><span className="resource-cell"><span className="resource-dot" />{r.resource}<small>{r.quantity}</small></span></td><td><span className={`priority priority-${r.priority.toLowerCase()}`}><i />{r.priority}</span></td><td><Status>{r.status}</Status></td></tr>)}{filteredRequests.length === 0 && <tr><td colSpan="5" className="empty-state">No requests match your search.</td></tr>}</tbody></table></div><div className="panel-foot"><span>Showing <strong>{filteredRequests.length}</strong> of {requests.length} requests</span><button onClick={() => setActive("Aid requests")}>Open request queue <Icon name="arrow" size={14}/></button></div></article>

          <article className="panel locations-panel"><div className="panel-head"><div><div className="eyebrow">IMPACT ZONES</div><h3>Affected locations</h3></div><button className="icon-button tiny-button" aria-label="More location options"><span>···</span></button></div><div className="map-card"><div className="map-grid"/><svg className="map-routes" viewBox="0 0 380 188" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 152 C 60 130, 52 98, 116 108 S 168 156, 214 120 S 280 99, 323 72 S 354 62, 395 48"/><path className="route-faint" d="M7 52 C60 64 71 34 132 51 S177 80 220 60 S286 39 382 21"/><path className="route-faint" d="M48 190 C102 159 105 134 150 124 S213 145 242 111 S270 89 286 62"/></svg><div className="map-label map-label-one"><span className="map-pulse"/><span>North Ward<small>420 affected</small></span></div><div className="map-label map-label-two"><span className="map-pulse map-pulse-orange"/><span>East Ward<small>180 affected</small></span></div><div className="map-water">Kaveri tributary</div><span className="map-scale">DEMO DISTRICT · KARNATAKA</span></div><div className="location-rows"><div><span className="location-pin pin-coral"><Icon name="pin" size={15}/></span><span><strong>North Ward</strong><small>North Relief Camp · 420 people</small></span><b>70%</b></div><div><span className="location-pin pin-amber"><Icon name="pin" size={15}/></span><span><strong>East Ward</strong><small>East Relief Camp · 180 people</small></span><b>30%</b></div></div><button className="map-link" onClick={() => setActive("Incidents")}>Open impact overview <Icon name="arrow" size={14}/></button></article></section>

        <section className="bottom-grid"><article className="panel stock-panel"><div className="panel-head"><div><div className="eyebrow">SUPPLY READINESS</div><h3>Camp inventory</h3></div><button className="text-link" onClick={() => setActive("Resources")}>Inventory <Icon name="arrow" size={15}/></button></div><div className="stock-list"><div className="stock-row"><span className="stock-emoji water">◉</span><span className="stock-name"><strong>Drinking water</strong><small>Essential supplies</small></span><div className="stock-bar"><i style={{width:"82%"}}/></div><span className="stock-amount">1,800 <small>L</small></span><Status>Available</Status></div><div className="stock-row"><span className="stock-emoji food">✳</span><span className="stock-name"><strong>Food packets</strong><small>Food supplies</small></span><div className="stock-bar"><i style={{width:"56%"}}/></div><span className="stock-amount">750 <small>pk</small></span><Status>Available</Status></div><div className="stock-row"><span className="stock-emoji blanket">▰</span><span className="stock-name"><strong>Blankets</strong><small>Shelter supplies</small></span><div className="stock-bar stock-bar-low"><i style={{width:"24%"}}/></div><span className="stock-amount">180 <small>pc</small></span><span className="status status-low"><i/>Low stock</span></div></div></article>
          <article className="panel activity-panel"><div className="panel-head"><div><div className="eyebrow">LATEST UPDATES</div><h3>Response activity</h3></div><button className="text-link" onClick={() => setActive("Incidents")}>Activity log <Icon name="arrow" size={15}/></button></div><div className="activity-list"><div className="activity-item"><span className="activity-icon activity-blue"><Icon name="box" size={15}/></span><span><strong>New urgent request received</strong><small>Drinking water · East Ward</small></span><time>08:42</time></div><div className="activity-item"><span className="activity-icon activity-green"><Icon name="people" size={15}/></span><span><strong>Volunteer team checked in</strong><small>North Relief Camp · 2 members</small></span><time>08:20</time></div><div className="activity-item"><span className="activity-icon activity-amber"><Icon name="camp" size={15}/></span><span><strong>Camp stock updated</strong><small>Blankets · North Relief Camp</small></span><time>07:54</time></div></div></article></section>
        </> : <SectionView name={active} requests={requests} onNewRequest={() => setShowModal(true)} />}
        <footer className="page-footer"><span>RELIEFOPS <i/> DISASTER RESPONSE COORDINATION</span><span>DEMO DATA · MYSQL SCHEMA <b>●</b> LOCAL PREVIEW</span></footer>
      </div>
    </main>
    {showModal && <Modal onClose={() => setShowModal(false)} onCreate={createRequest} />}
  </div>;
}
