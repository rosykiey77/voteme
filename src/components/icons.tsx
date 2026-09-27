import type { ReactNode, SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Pembungkus ikon: garis linear 1.75px, konsisten di semua ikon. */
function Stroke({ size = 20, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Stroke>
  );
}

export function VoteIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M5 8c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v11H5V8Z" />
      <path d="m9 12 2 2 4-4" />
      <path d="M22 19H2" />
    </Stroke>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3 3v18h18" />
      <rect x="7" y="11" width="3" height="7" rx="1" />
      <rect x="12" y="7" width="3" height="11" rx="1" />
      <rect x="17" y="4" width="3" height="14" rx="1" />
    </Stroke>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Stroke>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Stroke>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Stroke>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
      <path d="M8.5 20.5h7" />
      <path d="M12 16.5v4" />
    </Stroke>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Stroke>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Stroke>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </Stroke>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </Stroke>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01" />
      <path d="M8 14h8" />
    </Stroke>
  );
}

/** Ikon contactless/RFID */
export function CardIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M8 5a12 12 0 0 0 0 14" />
      <path d="M12 7.5a8 8 0 0 0 0 9" />
      <path d="M16 10a4 4 0 0 0 0 4" />
    </Stroke>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3 7v5.6a2 2 0 0 0 .6 1.4l6.4 6.4a2 2 0 0 0 2.8 0l5.6-5.6a2 2 0 0 0 0-2.8L12 5.6A2 2 0 0 0 10.6 5H5a2 2 0 0 0-2 2Z" />
      <circle cx="7.5" cy="9.5" r="1.1" />
    </Stroke>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Stroke>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Stroke>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 3h14" />
    </Stroke>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M19 21V8l-5-5H6a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1Z" />
      <path d="M9 13h6M9 17h4" />
    </Stroke>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M7 4.5v15l12-7.5-12-7.5Z" />
    </Stroke>
  );
}

export function StopIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Stroke>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </Stroke>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Stroke>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M10.3 4.3 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" />
    </Stroke>
  );
}
