---
name: RTL logical CSS refactor — Yaqoot Medical
description: How the RTL/LTR layout works in this app; which patterns to use and avoid.
---

## The mechanism
`LocaleContext` sets `document.documentElement.dir = "rtl" | "ltr"`, which globally propagates to all elements including `position: fixed` modals.

## Core rule
With `html[dir="rtl"]`, `flex-direction: row` already flows right-to-left. Adding `flexDirection: isRTL ? "row-reverse" : "row"` creates a DOUBLE REVERSAL — the element visually stays LTR. Remove it entirely or set `flexDirection: "row"`.

**Why:** The sidebar was stuck on the left in Arabic because AppLayout had `flexDirection: isRTL ? "row-reverse" : "row"` which cancelled the html direction.

## Correct logical CSS replacements
- `textAlign: isRTL ? "right" : "left"` → `textAlign: "start"`
- `flexDirection: isRTL ? "row-reverse" : "row"` → remove / `flexDirection: "row"`
- `[isRTL ? "right" : "left"]: N` (absolute position) → `insetInlineStart: N`
- `right: N` on trailing icon (ChevronDown) → `insetInlineEnd: N`
- `padding: "9px 32px 9px 12px"` (for trailing icon) → `paddingBlock, paddingInlineEnd: 32, paddingInlineStart: 12`
- `padding: "9px 12px 9px 32px"` (for leading icon, e.g. search) → `paddingBlock, paddingInlineStart: 32, paddingInlineEnd: 12`
- `borderRight/borderLeft swap` → `borderInlineEnd: "1px solid ..."` (sidebar border facing content)
- `justifyContent: isRTL ? "flex-start" : "flex-end"` → `justifyContent: "flex-end"` (same end-side logical)
- `justifyContent: isRTL ? "flex-end" : "flex-start"` → `justifyContent: "flex-start"` (same start-side logical)
- `alignSelf: isRTL ? "flex-end" : "flex-start"` → `alignSelf: "flex-start"` (column flex, start tracks inline-start)

## Keep direction on modals
`direction: isRTL ? "rtl" : "ltr"` on `position: fixed` modal inner containers is intentional belt-and-suspenders — keep it even though html already sets direction.

## Keep isRTL for non-CSS logic
- Arrow icon: `const Arrow = isRTL ? ArrowRight : ArrowLeft` — stays
- Date locale: `isRTL ? "ar-SA" : "en-US"` — stays

## Table direction
Remove `direction: isRTL ? "rtl" : "ltr"` from `<table>` — inherited from html.

## Files fully refactored
AppLayout, Sidebar, SettingsPage, PatientList, PatientProfile, VisitPage, AnalyticsPage, DataManagementPage, VitalsConfigPage, SystemInfoPage.
