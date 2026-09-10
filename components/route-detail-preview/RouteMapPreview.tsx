import { Bus, MapPin } from "lucide-react";

import type { RouteDetailPreviewViewModel } from "@/lib/route-detail-preview";

interface RouteMapPreviewProps {
  map: RouteDetailPreviewViewModel["map"];
  metrics: RouteDetailPreviewViewModel["metrics"];
  route: RouteDetailPreviewViewModel["route"];
}

const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 520;

export function RouteMapPreview({
  map,
  metrics,
  route,
}: RouteMapPreviewProps) {
  const routePoints = map.path
    .map(({ x, y }) => `${x * VIEWBOX_WIDTH},${y * VIEWBOX_HEIGHT}`)
    .join(" ");

  return (
    <section
      className="absolute inset-0 overflow-hidden bg-[#e6e9dc] text-[#434941]"
      aria-label={`${route.departureName} to ${route.arrivalName} map preview. ${route.statusLabel}. ${metrics.eta}, ${metrics.distance}. ${metrics.freshness}.`}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="520" fill="#e6e9dc" />
        <g fill="none" stroke="#c4cbc2" strokeWidth="3">
          <path d="M-20 105 C75 80 120 118 215 92 S335 72 430 118" />
          <path d="M28 -20 C62 90 28 175 55 270 S88 418 68 550" />
          <path d="M140 -20 C125 94 162 165 139 255 S128 421 170 550" />
          <path d="M260 -10 C238 105 278 200 250 310 S220 440 245 550" />
          <path d="M-20 355 C85 330 170 372 252 342 S340 322 430 355" />
        </g>
        <g fill="none" stroke="#d5dad1" strokeWidth="1.5">
          <path d="M0 220 L110 205 L225 230 L400 192" />
          <path d="M0 445 L115 410 L258 445 L400 420" />
          <path d="M330 0 L300 150 L345 265 L318 520" />
        </g>
        <polyline
          points={routePoints}
          fill="none"
          stroke="#22164f"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={routePoints}
          fill="none"
          stroke="#6555ae"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="absolute top-[19%] left-[58%] rounded-pill bg-status-active px-ui-4 py-ui-2 text-ui-sm font-medium text-status-active-foreground shadow-sm">
        {route.statusLabel}
      </div>

      <div className="absolute top-[36%] left-[43%] rounded-sm border border-[#5c615b] bg-[#fbfcf7] px-ui-3 py-ui-2 text-center text-[#161916] shadow-md">
        <strong className="block text-ui-lg leading-none">{metrics.eta}</strong>
        <span className="mt-ui-1 block text-ui-xs">{metrics.distance}</span>
      </div>

      <div
        className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-[#f7f8f2] bg-accent-deep text-white shadow-md"
        style={{
          left: `${map.shuttlePoint.x * 100}%`,
          top: `${map.shuttlePoint.y * 100}%`,
        }}
        aria-hidden="true"
      >
        <Bus className="size-5" />
      </div>

      <div className="absolute top-[13%] left-[68%] max-w-36 text-ui-sm font-medium">
        <MapPin className="mb-ui-1 size-5 fill-[#83918a] text-[#f7f8f2]" />
        {route.departureName}
      </div>
      <div className="absolute bottom-[5%] left-[18%] max-w-44 text-ui-sm font-bold">
        <MapPin className="mb-ui-1 size-5 fill-[#56635d] text-[#f7f8f2]" />
        {route.arrivalName}
      </div>
      <p className="absolute right-ui-4 bottom-ui-3 rounded-pill bg-white/75 px-ui-3 py-ui-1 text-ui-xs text-[#586059]">
        {metrics.freshness}
      </p>
    </section>
  );
}
