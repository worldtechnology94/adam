/**
 * Shared regex helpers for STE-7.x warning/caution engines.
 */

/** Line begins with WARNING/CAUTION/DANGER and colon; group 2 is body. */
export const STE7_SAFETY_LABEL_LINE = /^\s*(WARNING|CAUTION|DANGER)\s*:\s*(.*)$/i;

/** STE-7.2: meta-discourse lead-ins that delay command/condition. */
export const STE7_WEAK_LEAD_IN =
  /^\s*(Note that|It is important(?:\s+to)?|Please note|Remember that|You must know that|Be aware that)\b/i;
