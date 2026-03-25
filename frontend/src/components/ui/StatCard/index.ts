/**
 * StatCard Component Barrel Export
 * 
 * Re-exports all public API from the StatCard module for convenient importing.
 * 
 * @module
 * @version 1.0.0
 * @author Xavier Araque
 */

export { StatCard, statCardVariants } from "./StatCard";
export type { StatCardProps, StatCardIconSize } from "./StatCard.types";
export {
  STATCARD_DATA,
  STATCARD_ICON_SIZES,
  STATCARD_LABELS,
  STATCARD_VALUES,
  STATCARD_STATES,
} from "./StatCard.data";
export type { StatCardStateKey, StatCardLabelKey, StatCardValueKey } from "./StatCard.data";