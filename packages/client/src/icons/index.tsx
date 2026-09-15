import { Icon } from './Icon.js';

interface Props {
  readonly className?: string;
}

export const HomeIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Icon>
);

export const BriefcaseIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <rect x="2.5" y="7" width="19" height="13" rx="2" />
    <path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
    <path d="M2.5 12.5h19" />
  </Icon>
);

export const BagIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M5 7h14l1.2 13.2a1 1 0 0 1-1 1.1H4.8a1 1 0 0 1-1-1.1L5 7Z" />
    <path d="M8.5 10V6.5a3.5 3.5 0 1 1 7 0V10" />
  </Icon>
);

export const ShieldIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M12 3 4.5 6v6c0 4.5 3.1 7.9 7.5 9 4.4-1.1 7.5-4.5 7.5-9V6L12 3Z" />
    <path d="M12 9v3.5" />
    <path d="M12 15.5h.01" />
  </Icon>
);

export const NoteIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 10v4M18 10v4" />
  </Icon>
);

export const BuildingIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M4 21V5.5a1 1 0 0 1 .7-.95l8-2.5A1 1 0 0 1 14 3v18" />
    <path d="M14 9h5.3a1 1 0 0 1 1 1V21" />
    <path d="M2.5 21h19" />
    <path d="M7.5 8.5h3M7.5 12.5h3M7.5 16.5h3" />
  </Icon>
);

export const ScaleIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M12 3.5v17" />
    <path d="M6 20.5h12" />
    <path d="M4 7.5h16" />
    <path d="M7.5 7.5 4.5 14h6l-3-6.5Z" />
    <path d="M16.5 7.5 13.5 14h6l-3-6.5Z" />
  </Icon>
);

export const CheckIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </Icon>
);

export const AlertIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M10.3 4.3 2.6 17.6a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export const FlagIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <path d="M5 21V4" />
    <path d="M5 4.5h11l-2 4 2 4H5" />
  </Icon>
);

export const ClockIcon = ({ className }: Props): React.JSX.Element => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </Icon>
);
