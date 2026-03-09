# BackButton Component

A reusable back button component for consistent navigation across the app.

## Usage

```tsx
import { BackButton } from '@/components/ui'

// Basic usage - inline variant (absolute positioning)
<BackButton />

// Section variant - full width container
<BackButton variant="section" />

// Custom text and action
<BackButton 
  text="Cancel" 
  onPress={() => router.push('/home')} 
/>

// Icon only
<BackButton showText={false} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onPress` | `() => void` | `router.back()` | Custom back action |
| `text` | `string` | `'Back'` | Custom text label |
| `variant` | `'inline' \| 'section'` | `'inline'` | Layout variant |
| `showText` | `boolean` | `true` | Show/hide text label |
| `style` | `ViewStyle` | `undefined` | Custom button styling |
| `containerStyle` | `ViewStyle` | `undefined` | Custom container styling (section only) |
| `testID` | `string` | `'back-button'` | Test ID for automation |

## Variants

### Inline (Default)
- Absolute positioning at top-left
- Overlays content
- Best for screens with full-screen content

### Section
- Full-width container at top
- Part of normal layout flow
- Content flows below the button
- Best for structured layouts

## Examples

### Auth Screens
```tsx
// Sign-in, Sign-up (inline)
<BackButton variant="inline" />

// Email confirmation (section)
<BackButton variant="section" />
```

### Custom Actions
```tsx
// Custom navigation
<BackButton 
  text="Cancel"
  onPress={() => router.push('/settings')}
/>

// Icon only with custom styling
<BackButton 
  showText={false}
  style={{ backgroundColor: colors.card }}
/>
```

## Accessibility

- Proper `accessibilityRole="button"`
- Descriptive `accessibilityLabel`
- Helpful `accessibilityHint`
- Minimum 44pt touch target

## Features

- ✅ Consistent styling across app
- ✅ Proper safe area handling
- ✅ Theme-aware colors
- ✅ Accessibility compliant
- ✅ TypeScript support
- ✅ Test ID support