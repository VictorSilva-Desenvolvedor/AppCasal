---
name: Apex Velocity
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#1c1c1c'
  on-primary-container: '#858484'
  inverse-primary: '#5f5e5e'
  secondary: '#b1c5ff'
  on-secondary: '#002c70'
  secondary-container: '#0148ab'
  on-secondary-container: '#a6beff'
  tertiary: '#cac6c4'
  on-tertiary: '#31302f'
  tertiary-container: '#1d1c1b'
  on-tertiary-container: '#878482'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#dae2ff'
  secondary-fixed-dim: '#b1c5ff'
  on-secondary-fixed: '#001946'
  on-secondary-fixed-variant: '#00419e'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style

This design system is engineered for a high-performance motorcycle management experience. The aesthetic is **Modern Corporate** with **High-Contrast** automotive influences, prioritizing precision, speed, and technical reliability.

The interface leverages a sophisticated "Dark-First" philosophy, mirroring the premium materials found in motorcycle engineering—carbon fiber, brushed aluminum, and matte resins. The emotional response is one of absolute control and mechanical transparency, ensuring the user feels like a technician overseeing a precision machine rather than a consumer browsing a ledger.

## Colors

The palette is anchored by **Carbon Black**, providing a deep, non-distracting canvas that highlights critical data. 

- **Primary (Carbon Black):** Used for the structural base and primary containers.
- **Secondary (Racing Blue):** Used for primary actions, branding elements, and active states.
- **Accent (Safety Orange):** Reserved strictly for alerts, maintenance warnings, and high-priority indicators. Its high contrast against the dark base ensures immediate visibility.
- **Success (Forest Green):** Used for completed transactions and healthy vehicle status.
- **Surface Tiers:** We utilize a scale of deep grays (#1C1C1C to #2C2C2C) to create visual hierarchy without relying on traditional light-mode borders.

## Typography

The typographic system balances technical precision with editorial impact. 

- **Hanken Grotesk** is the voice of the brand, used for headings and prominent UI labels. Its sharp terminals and contemporary geometry evoke automotive branding.
- **Inter** provides maximum legibility for body text, descriptions, and functional instructions.
- **JetBrains Mono** is utilized for all numerical data, timestamps, and VIN numbers. The monospaced nature ensures that fluctuating payment amounts and dates remain perfectly aligned in lists and tables, reinforcing the "technical instrument" feel.

## Layout & Spacing

The layout follows a **Fluid Grid** model with high-density spacing to reflect a cockpit-like interface.

- **Grid:** A 12-column grid for desktop and a 4-column grid for mobile.
- **Rhythm:** An 8px base unit governs all dimensions.
- **Safe Zones:** Mobile layouts utilize generous 20px side margins to prevent "edge bleed" on curved smartphone displays.
- **Information Density:** Content-heavy sections (like payment history) use tight spacing (stack-sm) to allow more data visibility, while hero areas (vehicle display) use stack-lg to create breathing room and focus.

## Elevation & Depth

Elevation in this design system is conveyed through **Tonal Layering** and **Subtle Inner Glows** rather than traditional drop shadows.

- **Level 0 (Background):** The deepest hex (#121212).
- **Level 1 (Cards):** Slightly lighter (#1C1C1C) with a 1px solid border (#2C2C2C) to define edges.
- **Level 2 (Modals/Popovers):** Higher luminosity (#252525) with a subtle "rim light" effect (a 1px top border of #3A3A3A) to simulate light hitting a physical edge.
- **Active State:** Elements use a "Glow" effect by applying a low-spread outer shadow using the secondary Racing Blue at 30% opacity.

## Shapes

The shape language is **Soft (0.25rem)**. While modern, we avoid overly bubbly or circular corners to maintain a serious, mechanical tone. 

- **Small Components:** Checkboxes and small buttons use a 4px (0.25rem) radius.
- **Containers:** Large vehicle cards or status modules use a 8px (0.5rem) radius.
- **Interactive Indicators:** Progress bars and status pills utilize a full "pill" radius to distinguish them from structural containers.

## Components

### Status Cards & Progress Rings
Maintenance modules should feature a high-contrast circular progress ring. Use Racing Blue for healthy progress and Safety Orange for "service required" or "overdue" states. The center of the ring should display the numerical percentage in `data-tabular` typography.

### Action Buttons
- **Primary:** Solid Racing Blue with white text. Apply a subtle 10% gradient from top to bottom to give a "machined" look.
- **Secondary (Paid/Scheduled):** Ghost style with a 1px border and high-contrast text.
- **Destructive:** Minimalist text buttons in Safety Orange.

### Vehicle Display
The hero section of the app must feature a high-resolution cutout of the motorcycle. Use a subtle radial gradient behind the image (Racing Blue to Transparent) to create a spotlight effect.

### Lists
Payment and history items should use a strictly horizontal layout.
- Left side: Icon or Category label.
- Center: Date (muted gray).
- Right side: Amount in `data-tabular` (bold white) for instant scanability.

### Input Fields
Inputs should be "Underlined" or "Filled" with a dark gray background (#252525). When focused, the bottom border animates to Racing Blue. Use `label-caps` for field titles to maintain a technical manual aesthetic.