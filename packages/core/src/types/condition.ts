/**
 * Declarative predicates over collected case facts.
 *
 * Playbooks are data, never code, so every branch a playbook can express is one
 * of these variants. That keeps the legal logic auditable and lets a single pure
 * evaluator cover all of it.
 */
import type { FactId } from './facts.js';

export type Condition =
  | { readonly op: 'isTrue'; readonly fact: FactId }
  | { readonly op: 'isFalse'; readonly fact: FactId }
  | { readonly op: 'isKnown'; readonly fact: FactId }
  | { readonly op: 'isUnknown'; readonly fact: FactId }
  | { readonly op: 'gt'; readonly fact: FactId; readonly value: number }
  | { readonly op: 'lt'; readonly fact: FactId; readonly value: number }
  | { readonly op: 'equals'; readonly fact: FactId; readonly value: string | number | boolean }
  | { readonly op: 'anyOf'; readonly conditions: readonly Condition[] }
  | { readonly op: 'allOf'; readonly conditions: readonly Condition[] }
  | { readonly op: 'not'; readonly condition: Condition };
