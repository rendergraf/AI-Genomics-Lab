/**
 * Design System - Theme Configuration
 * 
 * Composes tokens into theme objects for UI components
 * Solo contiene utilidades genéricas, NO específicas de componentes.
 */

import { Size } from '../tokens/sizes';
import { Variant } from '../tokens/variants';

/**
 * Theme base genérico para cualquier componente
 */
export interface ThemeConfig {
  size: Size;
  variant: Variant;
}

/**
 * Size config genérico
 */
export interface SizeConfig {
  height: string;
  paddingX: string;
  fontSize: string;
}

/**
 * Variant config genérico
 */
export interface VariantConfig {
  container: {
    backgroundColor: string;
    borderColor: string;
  };
  text: {
    color: string;
  };
}

