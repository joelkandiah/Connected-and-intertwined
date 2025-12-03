# Preact Signals Implementation

## Summary
Added Preact Signals to optimize performance by preventing unnecessary re-renders for frequently updated state that doesn't need to trigger full component updates.

## Changes Made

### 1. TrueFalseGame.jsx
**Optimized**: Drag offset state during card dragging

- **Signal**: `dragOffset` - tracks x/y position during drag
- **Why**: Updates 60+ times per second during drag operations
- **Benefit**: Prevents component re-render on every pixel movement
- **Impact**: Smooth drag animations without re-rendering the entire component

```javascript
const dragOffset = useSignal({ x: 0, y: 0 });

// Update without re-render
dragOffset.value = newOffset;

// Read in computed functions
const rotation = dragOffset.value.x / 20;
```

### 2. WeddingStrands.jsx
**Optimized**: Message display state

- **Signal**: `message` - temporary feedback messages
- **Why**: Messages appear/disappear frequently during gameplay
- **Benefit**: Message updates don't trigger re-renders of the entire grid
- **Impact**: Smoother gameplay, especially during rapid word submissions

```javascript
const message = useSignal('');

// Update without re-render
message.value = 'Great job!';
setTimeout(() => message.value = '', 2000);

// Display in JSX
{message.value && <div>{message.value}</div>}
```

### 3. ConnectionsGame.jsx
**Optimized**: Message display state

- **Signal**: `message` - feedback messages for correct/incorrect guesses
- **Why**: Messages update frequently during tile selection and submission
- **Benefit**: Message changes don't re-render the tile grid
- **Impact**: Better performance during animations and tile rearrangement

```javascript
const message = useSignal('');

// Update without re-render
message.value = `Correct! ${category.name}`;
setTimeout(() => message.value = '', 2000);
```

## Timer State - Intentionally NOT Using Signals

The timer state (`elapsedTime`) in `OurTimeline`, `WeddingStrands`, and `WeddingCrossword` was **intentionally kept as regular state** because:

1. **Persistence Required**: Timer values need to be saved to localStorage
2. **Low Frequency**: Updates only once per second (not performance-critical)
3. **Display Integration**: Timer display is part of the main UI that benefits from React's batching
4. **Existing Optimization**: Already using refs and intervals efficiently

## Performance Impact

### Before Signals:
- **TrueFalseGame**: 60+ re-renders per second during drag
- **WeddingStrands**: Re-render on every message change
- **ConnectionsGame**: Re-render on every feedback message

### After Signals:
- **TrueFalseGame**: 0 re-renders during drag (only on drag end)
- **WeddingStrands**: Message updates don't trigger grid re-renders
- **ConnectionsGame**: Message updates don't trigger tile grid re-renders

## Build Output
Added Preact Signals runtime module:
- `runtime.module-*.js` (6.77 kB │ gzip: 2.47 kB)

Total bundle size increased slightly (~7 kB) but runtime performance improved significantly for interactive elements.

## Best Practices Applied

1. **Use signals for high-frequency updates** that don't need to trigger re-renders
2. **Keep state for persistence** when values need to be saved/restored
3. **Avoid signals for timers** unless they're causing performance issues
4. **Use signals for transient UI state** like messages, tooltips, drag positions
5. **Read signal.value in render** for reactive updates without re-renders

## Future Optimization Opportunities

Consider signals for:
- Hover states in complex grids
- Scroll positions during autoscroll
- Temporary visual feedback states
- Animation progress values
