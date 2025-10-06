import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductNormalizationService {
  normalizeProductName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return (
      name
        .toLowerCase()
        .trim()
        // Remove extra spaces but keep structure
        .replace(/\s+/g, ' ')
        // Normalize common variations
        .replace(/\b(ml|mililitros?)\b/g, 'ml')
        .replace(/\b(g|gr|gramos?)\b/g, 'g')
        .replace(/\b(kg|kilos?)\b/g, 'kg')
        .replace(/\b(m|metros?)\b/g, 'm')
        .replace(/\b(cm|centimetros?)\b/g, 'cm')
        .replace(/\b(mm|milimetros?)\b/g, 'mm')
        .replace(/\b(un|unidades?)\b/g, 'un')
        .replace(/\b(pzs?|piezas?)\b/g, 'pzs')
        // Normalize specific product variations
        .replace(/\b(megarollo|mega rollo|mega-rollo)\b/g, 'megarollo')
        .replace(/\b(doble hoja|doble-hoja|doblehoja)\b/g, 'doble hoja')
        .replace(/\b(clásica|clasica|classica)\b/g, 'clasica')
        .replace(/\b(ultra|ultra-|ultra_)\b/g, 'ultra')
        .replace(/\b(gigante|gigante-|gigante_)\b/g, 'gigante')
        // Normalize brand variations
        .replace(/\b(nova|nova-|nova_)\b/g, 'nova')
        .replace(/\b(abolengo|abolengo-|abolengo_)\b/g, 'abolengo')
        // Remove parentheses and their contents for better matching
        .replace(/\([^)]*\)/g, '')
        // Normalize unit patterns - make them consistent
        .replace(
          /\b(\d+)\s*(un|unidades?)\s*(\d+)\s*(m|metros?)\b/g,
          '$3$4 $1$2',
        )
        .replace(
          /\b(\d+)\s*(m|metros?)\s*(\d+)\s*(un|unidades?)\b/g,
          '$1$2 $3$4',
        )
        // More aggressive normalization for similar products
        .replace(
          /\b(\d+)\s*(m|metros?)\s*(\d+)\s*(un|unidades?)\b/g,
          '$1$2 $3$4',
        )
        .replace(
          /\b(\d+)\s*(un|unidades?)\s*(\d+)\s*(m|metros?)\b/g,
          '$3$4 $1$2',
        )
        // Normalize spacing around numbers and units
        .replace(/\b(\d+)\s*(m|metros?)\b/g, '$1$2')
        .replace(/\b(\d+)\s*(un|unidades?)\b/g, '$1$2')
        // Remove trailing periods and common suffixes
        .replace(/\.$/, '')
        .replace(/\s+$/, '')
        // Remove common stop words but keep important ones
        .replace(
          /\b(de|del|en|con|para|por|sin|sobre|bajo|entre|hasta|desde|durante|mediante|según|tras|ante|contra)\b/g,
          ' ',
        )
        // Clean up extra spaces again
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  normalizeBrand(brand: string): string {
    if (!brand || typeof brand !== 'string') {
      return '';
    }
    return (
      brand
        .toLowerCase()
        .trim()
        // Only remove extra spaces, keep special characters for brand names
        .replace(/\s+/g, ' ')
    );
  }
}
