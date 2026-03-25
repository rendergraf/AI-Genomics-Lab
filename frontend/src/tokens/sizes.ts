/**
 * Design Tokens - Size Tokens
 * 
 * Sizes: xs, sm, md, lg, xl
 * Estos son los tamaños base genéricos que pueden usar múltiples componentes.
 */

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SizeToken {
  height: string;
  paddingX: string;
  fontSize: string;
  lineHeight?: string;
}

export interface SizePalette {
  [size: string]: SizeToken;
}


