# AGENTS.md - Development Rules: Industrial Market Intelligence Platform (APIEJ - CRCAE)

## 1. Project Context

The system is an **Integrated Industrial Market Intelligence Platform**. It manages data related to industrial parks, industrial buildings, areas (m²), vacancy rates, average rental/sale prices (USD/m² and MXN/m²), gross/net absorption, and investment prospects.

## 2. Visual and UI/UX Guidelines

* **Corporate Color Palette**:

  * `brand-navy` (`#0E1A3D`): Headers, Sidebar, primary navigation.
  * `brand-blue` (`#4A6CFF`): Primary buttons, links, active states, accents.
  * `brand-emerald` (`#10B981`): Positive metrics, available buildings, absorption.
  * `brand-orange` (`#FF7A00`): Alert indicators, buildings under reservation, reviews.
  * `brand-bg` (`#F8FAFC`): Screen backgrounds and secondary containers.
* **Typography and Shape**: Softly rounded borders (`rounded-xl`), subtle shadows (`shadow-sm`, `shadow-md`), with a clean industrial enterprise SaaS design.
* **Micro-interactions**: Use smooth transitions with `framer-motion` or Tailwind CSS utilities.

## 3. Coding Principles

1. **Strict TypeScript**: Always define interfaces in `src/types/` before implementing components. Using `any` is strictly prohibited.
2. **Feature-First Architecture**: Separate views into `src/features/` and reusable components into `src/components/ui/`.
3. **Data Handling**: Consume decoupled data from `src/mock/`. The UI code must be ready to replace mock data with HTTP/API calls without modifying the design.
4. **Formatting**: All monetary and area values must use standard formatters (e.g., `$6.50 USD/m²`, `12,500 m²`).
