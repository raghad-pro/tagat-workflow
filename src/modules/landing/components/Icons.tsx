'use client'

// Lightweight inline SVG icon set (stroke inherits currentColor)
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const Icon = ({ children, size = 20, viewBox = '0 0 24 24', ...rest }: any) => (
  <svg width={size} height={size} viewBox={viewBox} {...base} {...rest} aria-hidden="true">
    {children}
  </svg>
)

export const MoonIcon = (p: any) => (
  <Icon {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Icon>
)

export const SunIcon = (p: any) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </Icon>
)

export const LangIcon = (p: any) => (
  <Icon {...p}>
    <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1" />
    <path d="m22 22-5-10-5 10M14 18h6" />
  </Icon>
)

export const ArrowIcon = ({ flip, ...p }: any) => (
  <Icon {...p} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const BoltIcon = (p: any) => (
  <Icon {...p}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
  </Icon>
)

export const UsersIcon = (p: any) => (
  <Icon {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
  </Icon>
)

export const ChartIcon = (p: any) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <path d="M8 17v-6M13 17V8M18 17v-9" />
  </Icon>
)

export const FolderPlusIcon = (p: any) => (
  <Icon {...p}>
    <path d="M4 4h6l2 3h8v13H4z" />
    <path d="M12 11v6M9 14h6" />
  </Icon>
)

export const UserPlusIcon = (p: any) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </Icon>
)

export const TrendIcon = (p: any) => (
  <Icon {...p}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Icon>
)

export const MailIcon = (p: any) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </Icon>
)

export const PhoneIcon = (p: any) => (
  <Icon {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
)

export const LinkedinIcon = (p: any) => (
  <Icon {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v2a6 6 0 0 1 2-2z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </Icon>
)

export const GlobeIcon = (p: any) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
  </Icon>
)

export const PinIcon = (p: any) => (
  <Icon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
)

export const CheckIcon = (p: any) => (
  <Icon {...p} strokeWidth={3}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
)

export const SendIcon = (p: any) => (
  <Icon {...p}>
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </Icon>
)

export const SparkleIcon = (p: any) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </Icon>
)

export const QuoteIcon = ({ size = 44, ...p }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M9.5 8C7 8 5 10 5 12.5c0 2.2 1.6 4 3.7 4.4-.4 1.3-1.3 2.3-2.7 3.1l1.4 1.5c2.9-1.4 4.6-4 4.6-7.5V12c0-2.2-1.3-4-2.5-4zm9 0c-2.5 0-4.5 2-4.5 4.5 0 2.2 1.6 4 3.7 4.4-.4 1.3-1.3 2.3-2.7 3.1l1.4 1.5c2.9-1.4 4.6-4 4.6-7.5V12c0-2.2-1.3-4-2.5-4z" />
  </svg>
)

export const UserSilhouetteIcon = ({ size = 44, ...p }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="12" cy="8.5" r="4.2" />
    <path d="M12 14.5c-4.6 0-8 2.6-8 6v1h16v-1c0-3.4-3.4-6-8-6z" />
  </svg>
)

export const LogoMark = ({ size = 30 }: any) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="wf-logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--accent)" />
        <stop offset="1" stopColor="var(--accent-2)" />
      </linearGradient>
    </defs>
    <path
      d="M3 8 L9 24 L14 12 L18 24 L24 8"
      stroke="url(#wf-logo-g)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M20 12 L29 6" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
  </svg>
)
