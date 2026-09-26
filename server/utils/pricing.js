export function computeSlotPrice(slot) {
  const capacity = slot.capacity || 1;
  const remaining = slot.remaining ?? capacity;
  const sold = capacity - remaining;
  const soldFraction = Math.min(sold / capacity, 1);
  const multiplier = 1 + soldFraction * 0.5;
  return Math.round(slot.price * multiplier);
}