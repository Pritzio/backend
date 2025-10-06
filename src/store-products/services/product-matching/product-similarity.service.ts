import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductSimilarityService {
  calculateSimilarity(
    name1: string,
    brand1: string | null,
    name2: string,
    brand2: string | null,
  ): number {
    const nameSimilarity = this._calculateStringSimilarity(name1, name2);

    let brandSimilarity = 0;
    if (brand1 && brand2) {
      brandSimilarity = this._calculateStringSimilarity(brand1, brand2);
    } else if (!brand1 && !brand2) {
      brandSimilarity = 1;
    } else {
      brandSimilarity = 0.5;
    }

    // Check for specific product variations that should NOT match
    const variationPenalty = this._calculateVariationPenalty(name1, name2);

    // Apply penalty if products have different key specifications
    const finalSimilarity =
      nameSimilarity * 0.7 + brandSimilarity * 0.3 - variationPenalty;

    return Math.max(0, finalSimilarity); // Ensure similarity is not negative
  }

  private _calculateStringSimilarity(str1: string, str2: string): number {
    // Extract numbers from both strings
    const numbers1 = this._extractNumbers(str1);
    const numbers2 = this._extractNumbers(str2);

    // If numbers are different, apply penalty
    let numberPenalty = 0;
    if (numbers1.length > 0 && numbers2.length > 0) {
      const numbersMatch = this._compareNumberArrays(numbers1, numbers2);
      if (!numbersMatch) {
        numberPenalty = 0.4; // 40% penalty for different numbers
      }
    }

    // Check for key product variations that should significantly reduce similarity
    const variationPenalty = this._calculateKeyVariationPenalty(str1, str2);

    const jaro = this._jaroSimilarity(str1, str2);
    const winkler = this._winklerBonus(str1, str2);

    const baseSimilarity = jaro + winkler * 0.1;

    // Apply penalties
    return Math.max(0, baseSimilarity - numberPenalty - variationPenalty);
  }

  private _calculateVariationPenalty(name1: string, name2: string): number {
    let penalty = 0;

    // Extract measurements and quantities
    const measurements1 = this._extractDetailedMeasurements(name1);
    const measurements2 = this._extractDetailedMeasurements(name2);

    // If both have measurements, check if they're different
    if (measurements1.length > 0 && measurements2.length > 0) {
      const hasDifferentMeasurements = measurements1.some(
        (m1) =>
          !measurements2.some((m2) =>
            this._areMeasurementsSimilar(m1.original, m2.original),
          ),
      );

      if (hasDifferentMeasurements) {
        penalty += 0.4; // High penalty for different measurements
      }
    }

    // Extract model numbers or SKUs
    const models1 = this._extractModels(name1);
    const models2 = this._extractModels(name2);

    if (models1.length > 0 && models2.length > 0) {
      const hasDifferentModels = models1.some(
        (m1) => !models2.some((m2) => m1 === m2),
      );

      if (hasDifferentModels) {
        penalty += 0.3; // Medium penalty for different models
      }
    }

    // Check for size variations (S, M, L, XL, etc.)
    const sizes1 = this._extractSizes(name1);
    const sizes2 = this._extractSizes(name2);

    if (sizes1.length > 0 && sizes2.length > 0) {
      const hasDifferentSizes = sizes1.some(
        (s1) => !sizes2.some((s2) => s1 === s2),
      );

      if (hasDifferentSizes) {
        penalty += 0.2; // Small penalty for different sizes
      }
    }

    return penalty;
  }

  private _extractModels(text: string): string[] {
    const modelRegex =
      /(?:modelo|model|ref|referencia|sku|art|articulo)[\s:]*([a-z0-9-]+)/gi;
    const matches = text.match(modelRegex);
    return matches
      ? matches.map((m) =>
          m.replace(
            /^(?:modelo|model|ref|referencia|sku|art|articulo)[\s:]*/i,
            '',
          ),
        )
      : [];
  }

  private _extractSizes(text: string): string[] {
    const sizeRegex = /\b(xxs|xs|s|m|l|xl|xxl|xxxl|\d+)\b/gi;
    const matches = text.match(sizeRegex);
    return matches || [];
  }

  _areMeasurementsSimilar(m1: string, m2: string): boolean {
    // Normalize measurements for comparison
    const normalizeMeasurement = (m: string) => {
      const num = parseFloat(m.replace(/[^\d.]/g, ''));
      const unit = m.replace(/[\d.]/g, '').toLowerCase();

      // Convert to base units for comparison
      if (unit.includes('g') && !unit.includes('kg')) return num; // grams
      if (unit.includes('kg')) return num * 1000; // kg to grams
      if (unit.includes('ml') && !unit.includes('l')) return num; // ml
      if (unit.includes('l') && !unit.includes('ml')) return num * 1000; // l to ml
      if (unit.includes('m') && !unit.includes('cm') && !unit.includes('mm'))
        return num; // meters
      if (unit.includes('cm')) return num / 100; // cm to meters
      if (unit.includes('mm')) return num / 1000; // mm to meters

      return num;
    };

    const val1 = normalizeMeasurement(m1);
    const val2 = normalizeMeasurement(m2);

    // Consider measurements similar if they're within 10% of each other
    const tolerance = 0.1;
    return Math.abs(val1 - val2) / Math.max(val1, val2) <= tolerance;
  }

  _extractDetailedMeasurements(
    name: string,
  ): Array<{ value: number; unit: string; original: string }> {
    const measurements: Array<{
      value: number;
      unit: string;
      original: string;
    }> = [];

    // Common measurement patterns
    const patterns = [
      // Length patterns: 70m, 100m, 50cm, 1.5m
      /(\d+(?:\.\d+)?)\s*(m|cm|mm|metros?|centimetros?|milimetros?)\b/gi,
      // Weight patterns: 500g, 1kg, 2.5kg
      /(\d+(?:\.\d+)?)\s*(g|kg|gramos?|kilos?)\b/gi,
      // Volume patterns: 1L, 500ml, 2.5L
      /(\d+(?:\.\d+)?)\s*(l|ml|litros?|mililitros?)\b/gi,
      // Count patterns: 2un, 3un, 1un
      /(\d+(?:\.\d+)?)\s*(un|unidades?|pcs?|piezas?)\b/gi,
      // Roll patterns: 70m, 100m (for paper products)
      /(\d+(?:\.\d+)?)\s*(m|metros?)\b/gi,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(name)) !== null) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        const original = match[0];

        // Normalize units
        let normalizedUnit = unit;
        if (unit.includes('metro') || unit === 'm') normalizedUnit = 'm';
        else if (unit.includes('centimetro') || unit === 'cm')
          normalizedUnit = 'cm';
        else if (unit.includes('milimetro') || unit === 'mm')
          normalizedUnit = 'mm';
        else if (unit.includes('gramo') || unit === 'g') normalizedUnit = 'g';
        else if (unit.includes('kilo') || unit === 'kg') normalizedUnit = 'kg';
        else if (unit.includes('litro') || unit === 'l') normalizedUnit = 'l';
        else if (unit.includes('mililitro') || unit === 'ml')
          normalizedUnit = 'ml';
        else if (unit.includes('unidad') || unit === 'un')
          normalizedUnit = 'un';

        measurements.push({
          value,
          unit: normalizedUnit,
          original,
        });
      }
    }

    return measurements;
  }

  private _calculateKeyVariationPenalty(str1: string, str2: string): number {
    let penalty = 0;

    // Define key product variations that should not match
    const keyVariations = [
      {
        terms: ['clasica', 'clásica'],
        opposite: ['doble hoja', 'ultra', 'evolution'],
      },
      {
        terms: ['doble hoja'],
        opposite: ['clasica', 'clásica', 'ultra', 'evolution'],
      },
      {
        terms: ['ultra'],
        opposite: ['clasica', 'clásica', 'doble hoja', 'evolution'],
      },
      {
        terms: ['evolution'],
        opposite: ['clasica', 'clásica', 'doble hoja', 'ultra'],
      },
    ];

    for (const variation of keyVariations) {
      const hasTerm1 = variation.terms.some((term) =>
        str1.toLowerCase().includes(term.toLowerCase()),
      );
      const hasTerm2 = variation.terms.some((term) =>
        str2.toLowerCase().includes(term.toLowerCase()),
      );

      const hasOpposite1 = variation.opposite.some((term) =>
        str1.toLowerCase().includes(term.toLowerCase()),
      );
      const hasOpposite2 = variation.opposite.some((term) =>
        str2.toLowerCase().includes(term.toLowerCase()),
      );

      // If one has the term and the other has the opposite, apply heavy penalty
      if ((hasTerm1 && hasOpposite2) || (hasTerm2 && hasOpposite1)) {
        penalty += 0.5; // 50% penalty for conflicting variations
      }
    }

    return penalty;
  }

  private _jaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow);
      const end = Math.min(i + matchWindow + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (
      (matches / str1.length +
        matches / str2.length +
        (matches - transpositions / 2) / matches) /
      3
    );
  }

  private _winklerBonus(str1: string, str2: string): number {
    let prefixLength = 0;
    const maxPrefix = Math.min(4, Math.min(str1.length, str2.length));

    for (let i = 0; i < maxPrefix; i++) {
      if (str1[i] === str2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    return prefixLength;
  }

  private _extractNumbers(str: string): number[] {
    // Extract all numbers from the string
    const matches = str.match(/\d+(?:\.\d+)?/g);
    if (!matches) return [];

    return matches.map((match) => parseFloat(match));
  }

  private _compareNumberArrays(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;

    // Sort both arrays to compare regardless of order
    const sorted1 = [...arr1].sort((a, b) => a - b);
    const sorted2 = [...arr2].sort((a, b) => a - b);

    for (let i = 0; i < sorted1.length; i++) {
      if (Math.abs(sorted1[i] - sorted2[i]) > 0.01) {
        // Allow small floating point differences
        return false;
      }
    }

    return true;
  }
}
