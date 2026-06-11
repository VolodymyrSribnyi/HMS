# AGENTS_UI.md — Neumorphism Design System

> This document defines the mandatory UI design language for the entire frontend application.
> All generated UI must follow these rules unless explicitly overridden by the user.

---

# Design Philosophy

The application uses Modern Soft Neumorphism.

The interface should feel:

* soft
* premium
* calm
* spacious
* tactile
* modern

Avoid corporate Bootstrap aesthetics.

Avoid default browser styling.

Every component should appear as if it is physically embedded into or raised from the surface.

---

# Visual Identity

Primary style: Neumorphism

Design keywords:

* Soft UI
* Neumorphism
* Glass-soft surfaces
* Subtle depth
* Rounded shapes
* Minimalism
* Modern SaaS

---

# Color Palette

Background:

* #e8ecf2
* #edf1f7
* #f1f4f9

Primary Accent:

* #4f7cff

Success:

* #2fb67d

Warning:

* #f0a500

Danger:

* #e45858

Text:

* Primary: #2d3748
* Secondary: #718096

Never use:

* pure black (#000000)
* pure white (#FFFFFF)

---

# Shadows

Raised component:

box-shadow:
8px 8px 16px rgba(163,177,198,0.6),
-8px -8px 16px rgba(255,255,255,0.9);

Pressed component:

box-shadow:
inset 6px 6px 12px rgba(163,177,198,0.5),
inset -6px -6px 12px rgba(255,255,255,0.8);

Floating card:

box-shadow:
12px 12px 24px rgba(163,177,198,0.35),
-12px -12px 24px rgba(255,255,255,0.8);

---

# Border Radius

Buttons:
16px

Inputs:
18px

Cards:
24px

Panels:
24px

Dialogs:
28px

Never use sharp corners.

---

# Layout

Use generous spacing.

Minimum gaps:

* gap-4 between controls
* gap-6 between sections
* gap-8 between major blocks

Avoid crowded interfaces.

Whitespace is preferred over density.

---

# Buttons

All buttons must use neumorphic styling.

Requirements:

* rounded corners
* soft shadows
* smooth hover
* smooth active state

Hover:

* slightly elevated

Pressed:

* inset shadows

Never use:

* Bootstrap buttons
* flat square buttons
* hard borders

---

# Inputs

All inputs must look embedded into the surface.

Requirements:

* inset shadow
* borderless appearance
* soft background

Focus state:

* blue glow
* maintain accessibility

---

# Cards

Cards are the primary content container.

Requirements:

* large radius
* floating appearance
* no visible border

Cards should visually separate content using depth rather than borders.

---

# Tables

Avoid traditional enterprise tables.

Prefer:

* cards
* sections
* grouped rows

If a table is required:

* large row height
* subtle separators
* rounded container

---

# Sidebar

Sidebar must use:

* soft elevated panel
* neumorphic menu items
* active item with inset effect

No dark admin-dashboard style.

---

# Modals

Modals should appear elevated above the page.

Requirements:

* large radius
* large shadow
* soft overlay

---

# Animations

Use subtle animations only.

Duration:

* 150ms
* 200ms
* 300ms

Allowed:

* hover lift
* shadow transition
* fade
* scale 1.02

Avoid:

* flashy animations
* bouncing
* excessive motion

---

# Tailwind Guidelines

Prefer:

* rounded-2xl
* rounded-3xl
* shadow custom utilities
* transition-all
* duration-200

Create reusable utility classes for neumorphic surfaces.

Avoid repeated inline class duplication.

---

# Accessibility

Neumorphism must never reduce usability.

Requirements:

* WCAG contrast compliance
* visible focus states
* keyboard navigation support

Accessibility overrides aesthetics.

---

# Component Generation Rules

When generating new React components:

1. Always use neumorphic surfaces.
2. Always use rounded corners.
3. Prefer cards over bordered containers.
4. Prefer depth over borders.
5. Use soft shadows.
6. Use spacious layouts.
7. Maintain responsive design.
8. Preserve accessibility.

These rules are mandatory for all newly generated UI.
