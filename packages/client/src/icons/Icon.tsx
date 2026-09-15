interface IconProps {
  /** Explicitly allows `undefined` so callers can forward an optional prop. */
  readonly className: string | undefined;
  readonly children: React.ReactNode;
}

/**
 * Shared SVG frame. Icons are always decorative here — every one sits beside
 * text that already carries the meaning — so they are hidden from assistive
 * technology rather than labelled.
 */
export function Icon({ className, children }: IconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className ?? 'size-5'}`}
    >
      {children}
    </svg>
  );
}
