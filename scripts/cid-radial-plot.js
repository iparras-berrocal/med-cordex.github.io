let CID_DATA = null;

const width = 760;
const height = 940;
const radius = 235;
const centerX = width / 2;
const centerY = 345;

const CID_ORDER = [
  "SST",
  "SBT",
  "Nmonth_sst_p99",
  "Nmonth_sst_p01",
  "NMONTH_T20m",
  "SSS",
  "MLD",
  "SI",
  "Nmonth_ws_p99",
  "CUIfav"
];

const CID_LABELS = {
  SST: "SST",
  SBT: "SBT",
  Nmonth_sst_p99: "NM SST>P99",
  Nmonth_sst_p01: "NM SST<P1",
  SSS: "SSS",
  MLD: "MLDₘₐₓ",
  SI: "SI",
  CUIfav: "CUI",
  Nmonth_ws_p99: "NMτ>P99",
  NMONTH_T20m: "NM T₂₀ₘ >25°C"
};

const LIKE_ORDER = [
  "High confidence of increase",
  "Low confidence of increase",
  "Low confidence in direction of change",
  "Low confidence of decrease",
  "High confidence of decrease",
  "Not broadly relevant"
];

const IPCC_COLOR_MAP = {
  "High confidence of increase": "#F89C2E",
  "Low confidence of increase": "#FDD494",
  "Low confidence in direction of change": "#FFFFFF",
  "Low confidence of decrease": "#9ECAE1",
  "High confidence of decrease": "#2C7FB8",
  "Not broadly relevant": "#C9C9C9"
};

const container = document.getElementById("cid-radial-plot");
container.innerHTML = "";

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", width);
svg.setAttribute("height", height);
svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
svg.style.maxWidth = "100%";
svg.style.height = "auto";
container.appendChild(svg);

function makeEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function polar(r, angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  return {
    x: centerX + r * Math.cos(angle),
    y: centerY + r * Math.sin(angle)
  };
}

function getCidAngles() {
  const step = 360 / CID_ORDER.length;
  const angles = {};

  for (let i = 0; i < CID_ORDER.length; i++) {
    const cid = CID_ORDER[i];

    const angle1 = -108 + i * step;
    const angle2 = -108 + (i + 1) * step;

    angles[cid] = [angle1, angle2];
  }

  return angles;
}

function clearSvg() {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

function polygonPoints(points) {
  return points.map(p => `${p.x},${p.y}`).join(" ");
}

function drawPolygonRingGuides(nRings, nSides) {
  const step = 360 / nSides;

  for (let i = 0; i < nRings; i++) {
    const r = radius - i * (radius / nRings);
    const pts = [];

    for (let j = 0; j < nSides; j++) {
      pts.push(polar(r, -180 + j * step));
    }

    svg.appendChild(
      makeEl("polygon", {
        points: polygonPoints(pts),
        fill: "none",
        stroke: "lightgrey",
        "stroke-width": 1
      })
    );
  }
}

function drawSectorPolygon(rOuter, rInner, angle1, angle2, fill) {
  const points = [
    polar(rOuter, angle1),
    polar(rOuter, angle2),
    polar(rInner, angle2),
    polar(rInner, angle1)
  ];

  svg.appendChild(
    makeEl("polygon", {
      points: polygonPoints(points),
      fill: fill,
      stroke: "black",
      "stroke-width": 0.8
    })
  );
}

function drawCidLabels(angles) {
  for (const cid of CID_ORDER) {
    const [a1, a2] = angles[cid];
    const mid = (a1 + a2) / 2;

    let labelRadius = radius * 1.10;

    if (cid === "SST") labelRadius = radius * 1.12;
    if (cid === "SBT") labelRadius = radius * 1.11;
    if (cid === "Nmonth_sst_p99") labelRadius = radius * 1.11;
    if (cid === "Nmonth_sst_p01") labelRadius = radius * 1.11;
    if (cid === "NMONTH_T20m") labelRadius = radius * 1.12;
    if (cid === "SSS") labelRadius = radius * 1.10;
    if (cid === "MLD") labelRadius = radius * 1.10;
    if (cid === "SI") labelRadius = radius * 1.10;
    if (cid === "Nmonth_ws_p99") labelRadius = radius * 1.11;
    if (cid === "CUIfav") labelRadius = radius * 1.10;

    const p = polar(labelRadius, mid);

    const text = makeEl("text", {
      x: p.x,
      y: p.y,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": 13,
      "font-weight": "bold",
      fill: "gray"
    });

    text.textContent = CID_LABELS[cid] || cid;
    svg.appendChild(text);
  }
}

function drawGwlLabels(gwls) {
  const labels = ["Hist."].concat(gwls.slice(1).map(g => `+${g}°C`));
  const n = gwls.length;
  const ringSize = radius / n;

  const angle = -72;

  for (let i = 0; i < n; i++) {
    const r = radius - (i + 0.5) * ringSize;
    const p = polar(r, angle);

    const text = makeEl("text", {
      x: p.x,
      y: p.y,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": 12,
      "font-weight": "bold",
      fill: "black"
    });

    text.textContent = labels[i];
    svg.appendChild(text);
  }
}

function drawTrendArrow(angle1, angle2, trend) {
  if (!trend || !trend.significant || !trend.direction) return;

  const mid = (angle1 + angle2) / 2;
  const ringSize = radius / 5;
  const r = radius - 0.55 * ringSize;
  const c = polar(r, mid);

  const arrowAngle = trend.direction === "up" ? -45 : 45;
  const len = 22;
  const dx = Math.cos(arrowAngle * Math.PI / 180) * len;
  const dy = Math.sin(arrowAngle * Math.PI / 180) * len;

  svg.appendChild(
    makeEl("line", {
      x1: c.x - dx / 2,
      y1: c.y - dy / 2,
      x2: c.x + dx / 2,
      y2: c.y + dy / 2,
      stroke: "black",
      "stroke-width": 1.6,
      "marker-end": "url(#arrowhead)"
    })
  );
}

function addArrowMarker() {
  const defs = makeEl("defs");

  const marker = makeEl("marker", {
    id: "arrowhead",
    markerWidth: 8,
    markerHeight: 6,
    refX: 7,
    refY: 3,
    orient: "auto"
  });

  marker.appendChild(
    makeEl("polygon", {
      points: "0 0, 8 3, 0 6",
      fill: "black"
    })
  );

  defs.appendChild(marker);
  svg.appendChild(defs);
}

function drawTitle(region) {
  const text = makeEl("text", {
    x: centerX,
    y: 42,
    "text-anchor": "middle",
    "font-size": 15,
    "font-weight": "bold",
    fill: "black"
  });

  text.textContent = region;
  svg.appendChild(text);
}

function drawLegendArrow(x, y, direction) {
  const angle = direction === "up" ? -45 : 45;
  const len = 18;
  const dx = Math.cos(angle * Math.PI / 180) * len;
  const dy = Math.sin(angle * Math.PI / 180) * len;

  svg.appendChild(
    makeEl("line", {
      x1: x - dx / 2,
      y1: y - dy / 2,
      x2: x + dx / 2,
      y2: y + dy / 2,
      stroke: "black",
      "stroke-width": 1.6,
      "marker-end": "url(#arrowhead)"
    })
  );
}

function drawLegend() {
  const x = 130;
  let y = 675;

  svg.appendChild(
    makeEl("rect", {
      x: x - 25,
      y: y - 40,
      width: 520,
      height: 200,
      fill: "white",
      stroke: "#cccccc",
      "stroke-width": 1
    })
  );

  const title = makeEl("text", {
    x,
    y: y - 18,
    "font-size": 14,
    "font-weight": "bold"
  });

  title.textContent = "Key for level of confidence in future changes";
  svg.appendChild(title);

  y += 5;

  for (const label of LIKE_ORDER) {
    svg.appendChild(
      makeEl("rect", {
        x,
        y,
        width: 28,
        height: 13,
        fill: IPCC_COLOR_MAP[label],
        stroke: "black",
        "stroke-width": 0.8
      })
    );

    const text = makeEl("text", {
      x: x + 42,
      y: y + 11,
      "font-size": 14
    });

    text.textContent = label;
    svg.appendChild(text);

    y += 24;
  }

  const box2Y = y + 45;

  svg.appendChild(
    makeEl("rect", {
      x: x - 25,
      y: box2Y - 30,
      width: 520,
      height: 62,
      fill: "white",
      stroke: "#cccccc",
      "stroke-width": 1
    })
  );

  const title2 = makeEl("text", {
    x,
    y: box2Y - 11,
    "font-size": 13,
    "font-weight": "bold"
  });

  title2.textContent = "Key for observational trend evidence";
  svg.appendChild(title2);

  drawLegendArrow(x + 18, box2Y + 15, "up");
  drawLegendArrow(x + 220, box2Y + 15, "down");

  const upText = makeEl("text", {
    x: x + 42,
    y: box2Y + 19,
    "font-size": 12.5
  });

  upText.textContent = "Past upward trend";
  svg.appendChild(upText);

  const downText = makeEl("text", {
    x: x + 245,
    y: box2Y + 19,
    "font-size": 12.5
  });

  downText.textContent = "Past downward trend";
  svg.appendChild(downText);
}

function drawRadial(method, region) {
  clearSvg();
  addArrowMarker();

  const meta = CID_DATA.metadata;
  const angles = getCidAngles();
  const gwls = meta.gwls;
  const data = CID_DATA.data[method][region];

  const nRings = gwls.length;
  const ringSize = radius / nRings;

  drawTitle(region);
  drawPolygonRingGuides(nRings, 10);

  for (const cid of CID_ORDER) {
    if (!data[cid]) continue;

    const fills = data[cid].fills;
    const [angle1, angle2] = angles[cid];

    for (let i = 0; i < fills.length; i++) {
      const rOuter = radius - i * ringSize;
      const rInner = radius - (i + 1) * ringSize;

      drawSectorPolygon(
        rOuter,
        rInner,
        angle1,
        angle2,
        fills[i]
      );
    }

    drawTrendArrow(angle1, angle2, data[cid].trend);
  }

  drawCidLabels(angles);
  drawGwlLabels(gwls);
  drawLegend();
}

function updatePlot() {
  const method = document.getElementById("cid-method").value;
  const region = document.getElementById("cid-region").value;

  drawRadial(method, region);
}

const basePath = window.location.pathname.includes("/med-cordex.github.io/")
  ? "/med-cordex.github.io"
  : "";

fetch(`${basePath}/images/cid_data.json`)
  .then(r => r.json())
  .then(data => {
    CID_DATA = data;

    document
      .getElementById("cid-method")
      .addEventListener("change", updatePlot);

    document
      .getElementById("cid-region")
      .addEventListener("change", updatePlot);

    updatePlot();
  })
  .catch(error => {
    container.innerHTML =
      `<p style="color:red;">Could not load CID data: ${error}</p>`;
  });
