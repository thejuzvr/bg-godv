# Design System - ElderScrollsIdle

## Components

### PageContainer
A wrapper for all page content to ensure consistent padding and max-width.

**Usage:**
```tsx
import { PageContainer } from "@/components/layout/page-container";

export default function MyPage() {
  return (
    <PageContainer maxWidth="4xl">
      {/* Content */}
    </PageContainer>
  );
}
```

**Props:**
- `maxWidth`: `'none' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'container'` (Default: `'none'`)
- `centered`: `boolean` (Default: `false`)

---

### SectionContainer
A wrapper for sections to ensure consistent vertical spacing between elements.

**Usage:**
```tsx
import { SectionContainer } from "@/components/layout/section-container";

export default function MyPage() {
  return (
    <PageContainer>
      <SectionContainer>
        <Section1 />
        <Section2 />
      </SectionContainer>
    </PageContainer>
  );
}
```

---

## Typography Guidelines
- Use `font-headline` for all headings.
- Use `font-body` for all body text.
- Use standard shadcn/ui typography components when available (e.g., `CardTitle`, `CardDescription`).

## Spacing Tokens
- Page Padding: `p-4 md:p-8`
- Section Gaps: `gap-4 md:gap-8` or `space-y-4 md:space-y-8`
- Grid Gaps: `gap-4 md:gap-8`
