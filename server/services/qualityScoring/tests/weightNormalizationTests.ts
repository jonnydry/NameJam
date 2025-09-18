/**
 * Weight Normalization and Field Mapping Tests
 * Validates critical fixes for musicality scoring system
 */

import { EnhancedNameScoringEngine } from '../enhancedNameScoringEngine';
import { secureLog } from '../../../utils/secureLogger';
import type { EnhancedNameScoringRequest, EnhancedScoreBreakdown } from '../enhancedInterfaces';

interface ValidationResult {
  testName: string;
  passed: boolean;
  details: string;
  actualValue?: number;
  expectedRange?: { min: number; max: number };
  errors?: string[];
}

export class WeightNormalizationValidator {
  private scoringEngine: EnhancedNameScoringEngine;
  
  constructor() {
    this.scoringEngine = new EnhancedNameScoringEngine();
  }
  
  /**
   * Run all validation tests
   */
  async runAllTests(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      // Test 1: Weight normalization
      results.push(await this.testWeightNormalization());
      
      // Test 2: Field mapping validation
      results.push(...(await this.testFieldMapping()));
      
      // Test 3: Score range validation across genres
      results.push(...(await this.testScoreRangeValidation()));
      
      // Test 4: Musical synergy field population
      results.push(await this.testMusicalSynergyFieldPopulation());
      
      // Test 5: Overall score calculation integrity
      results.push(await this.testOverallScoreCalculationIntegrity());
      
    } catch (error) {
      results.push({
        testName: 'Critical Test Failure',
        passed: false,
        details: `Critical error during testing: ${error}`,
        errors: [error instanceof Error ? error.message : String(error)]
      });
    }
    
    return results;
  }
  
  /**
   * Test 1: Validate that enhanced weights sum exactly to 1.0
   */
  async testWeightNormalization(): Promise<ValidationResult> {
    try {
      // Access the private weights through reflection
      const weights = (this.scoringEngine as any).enhancedWeights;
      
      const weightSum = Object.values(weights).reduce((sum, weight) => sum + (weight as number), 0);
      const tolerance = 0.001; // Allow minimal floating point precision errors
      
      const isNormalized = Math.abs(weightSum - 1.0) < tolerance;
      
      return {
        testName: 'Weight Normalization',
        passed: isNormalized,
        details: isNormalized 
          ? `Weights properly normalized to ${weightSum.toFixed(6)} (within tolerance)`
          : `FAIL: Weights sum to ${weightSum.toFixed(6)}, expected 1.0 ± ${tolerance}`,
        actualValue: weightSum,
        expectedRange: { min: 1.0 - tolerance, max: 1.0 + tolerance }
      };
    } catch (error) {
      return {
        testName: 'Weight Normalization',
        passed: false,
        details: `Error accessing weights: ${error}`,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * Test 2: Validate all required fields are populated in EnhancedScoreBreakdown
   */
  async testFieldMapping(): Promise<ValidationResult[]> {
    const testCases = [
      { name: 'Thunder Strike', genre: 'rock', mood: 'energetic', type: 'band' as const },
      { name: 'Midnight Jazz', genre: 'jazz', mood: 'smooth', type: 'band' as const },
      { name: 'Digital Dreams', genre: 'electronic', mood: 'futuristic', type: 'song' as const }
    ];
    
    const results: ValidationResult[] = [];
    
    for (const testCase of testCases) {
      try {
        const request: EnhancedNameScoringRequest = {
          name: testCase.name,
          type: testCase.type,
          genre: testCase.genre,
          mood: testCase.mood,
          isAiGenerated: true,
          targetAudience: 'mainstream',
          analysisDepth: 'comprehensive'
        };
        
        const result = await this.scoringEngine.scoreNameEnhanced(request);
        const breakdown = result.score.breakdown;
        
        // Required musicality fields that were previously missing
        const requiredFields = [
          'rhymeQuality',
          'rhythmQuality', 
          'musicalCoherence',
          'vocalDeliverability',
          'musicalSynergy',
          'phoneticSemanticAlignment',
          'semanticCoherence',
          'emotionalResonance'
        ];
        
        const missingFields: string[] = [];
        const invalidFields: string[] = [];
        
        for (const field of requiredFields) {
          const value = breakdown[field as keyof EnhancedScoreBreakdown] as number;
          
          if (value === undefined || value === null) {
            missingFields.push(field);
          } else if (isNaN(value) || value < 0 || value > 1) {
            invalidFields.push(`${field}: ${value}`);
          }
        }
        
        const passed = missingFields.length === 0 && invalidFields.length === 0;
        
        results.push({
          testName: `Field Mapping - ${testCase.name} (${testCase.genre})`,
          passed,
          details: passed 
            ? `All ${requiredFields.length} required fields properly populated and valid`
            : `Missing: [${missingFields.join(', ')}], Invalid: [${invalidFields.join(', ')}]`,
          errors: [...missingFields.map(f => `Missing field: ${f}`), ...invalidFields.map(f => `Invalid field: ${f}`)]
        });
        
      } catch (error) {
        results.push({
          testName: `Field Mapping - ${testCase.name}`,
          passed: false,
          details: `Error during scoring: ${error}`,
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Test 3: Validate overall scores remain within [0,1] range across genres
   */
  async testScoreRangeValidation(): Promise<ValidationResult[]> {
    const genreTests = [
      { genre: 'rock', names: ['Thunder Strike', 'Electric Storm', 'Fire Within'] },
      { genre: 'jazz', names: ['Midnight Blue', 'Velvet Swing', 'Cool Breeze'] },
      { genre: 'electronic', names: ['Digital Pulse', 'Cyber Wave', 'Neon Circuit'] },
      { genre: 'classical', names: ['Symphony Dawn', 'Sonata Dreams', 'Concerto Night'] }
    ];
    
    const results: ValidationResult[] = [];
    
    for (const genreTest of genreTests) {
      const scores: number[] = [];
      const invalidScores: string[] = [];
      
      try {
        for (const name of genreTest.names) {
          const request: EnhancedNameScoringRequest = {
            name,
            type: 'band',
            genre: genreTest.genre,
            isAiGenerated: true,
            analysisDepth: 'standard'
          };
          
          const result = await this.scoringEngine.scoreNameEnhanced(request);
          const overallScore = result.score.overall;
          
          scores.push(overallScore);
          
          if (isNaN(overallScore) || overallScore < 0 || overallScore > 1) {
            invalidScores.push(`${name}: ${overallScore}`);
          }
        }
        
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const passed = invalidScores.length === 0;
        
        results.push({
          testName: `Score Range - ${genreTest.genre.toUpperCase()}`,
          passed,
          details: passed 
            ? `All scores valid (avg: ${avgScore.toFixed(3)}, range: ${Math.min(...scores).toFixed(3)}-${Math.max(...scores).toFixed(3)})`
            : `Invalid scores: ${invalidScores.join(', ')}`,
          actualValue: avgScore,
          expectedRange: { min: 0, max: 1 },
          errors: invalidScores.map(s => `Invalid score: ${s}`)
        });
        
      } catch (error) {
        results.push({
          testName: `Score Range - ${genreTest.genre.toUpperCase()}`,
          passed: false,
          details: `Error during genre testing: ${error}`,
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Test 4: Specifically validate musicalSynergy field population
   */
  async testMusicalSynergyFieldPopulation(): Promise<ValidationResult> {
    try {
      const request: EnhancedNameScoringRequest = {
        name: 'Rhythm Flow',
        type: 'band',
        genre: 'rock',
        isAiGenerated: true,
        analysisDepth: 'comprehensive'
      };
      
      const result = await this.scoringEngine.scoreNameEnhanced(request);
      const breakdown = result.score.breakdown;
      
      const musicalSynergyValue = breakdown.musicalSynergy;
      
      const isValid = 
        musicalSynergyValue !== undefined &&
        musicalSynergyValue !== null &&
        !isNaN(musicalSynergyValue) &&
        musicalSynergyValue >= 0 &&
        musicalSynergyValue <= 1;
      
      return {
        testName: 'Musical Synergy Field Population',
        passed: isValid,
        details: isValid 
          ? `musicalSynergy properly populated with value: ${musicalSynergyValue.toFixed(4)}`
          : `musicalSynergy field invalid: ${musicalSynergyValue}`,
        actualValue: musicalSynergyValue,
        expectedRange: { min: 0, max: 1 }
      };
      
    } catch (error) {
      return {
        testName: 'Musical Synergy Field Population',
        passed: false,
        details: `Error testing musicalSynergy field: ${error}`,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * Test 5: Validate overall score calculation integrity
   * Ensure the weighted sum produces expected results
   */
  async testOverallScoreCalculationIntegrity(): Promise<ValidationResult> {
    try {
      const request: EnhancedNameScoringRequest = {
        name: 'Test Name',
        type: 'band',
        genre: 'rock',
        isAiGenerated: true,
        analysisDepth: 'comprehensive'
      };
      
      const result = await this.scoringEngine.scoreNameEnhanced(request);
      const breakdown = result.score.breakdown;
      const overallScore = result.score.overall;
      
      // Get weights to verify calculation manually
      const weights = (this.scoringEngine as any).enhancedWeights;
      
      // Manual calculation to verify integrity
      const manualScore = 
        breakdown.creativity * weights.creativity +
        breakdown.appropriateness * weights.appropriateness +
        breakdown.quality * weights.quality +
        breakdown.memorability * weights.memorability +
        breakdown.uniqueness * weights.uniqueness +
        breakdown.structure * weights.structure +
        breakdown.phoneticFlow * weights.phoneticFlow +
        breakdown.semanticCoherence * weights.semanticCoherence +
        breakdown.emotionalResonance * weights.emotionalResonance +
        breakdown.culturalAppeal * weights.culturalAppeal +
        breakdown.rhymeQuality * weights.rhymeQuality +
        breakdown.rhythmQuality * weights.rhythmQuality +
        breakdown.musicalCoherence * weights.musicalCoherence +
        breakdown.vocalDeliverability * weights.vocalDeliverability +
        breakdown.musicalSynergy * weights.musicalSynergy +
        breakdown.phoneticSemanticAlignment * weights.crossDimensionalSynergy;
      
      // Allow for bonuses in the calculation (tolerance)
      const tolerance = 0.15; // Allow up to 15% difference due to bonuses
      const difference = Math.abs(overallScore - manualScore);
      const withinTolerance = difference <= tolerance;
      
      return {
        testName: 'Overall Score Calculation Integrity',
        passed: withinTolerance,
        details: withinTolerance
          ? `Score calculation integrity verified (diff: ${difference.toFixed(4)})`
          : `Score calculation mismatch. Actual: ${overallScore.toFixed(4)}, Expected: ${manualScore.toFixed(4)}, Diff: ${difference.toFixed(4)}`,
        actualValue: overallScore,
        expectedRange: { min: manualScore - tolerance, max: manualScore + tolerance }
      };
      
    } catch (error) {
      return {
        testName: 'Overall Score Calculation Integrity',
        passed: false,
        details: `Error testing score calculation: ${error}`,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * Generate comprehensive test report
   */
  generateTestReport(results: ValidationResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    let report = '='.repeat(60) + '\n';
    report += 'MUSICALITY SCORING VALIDATION REPORT\n';
    report += '='.repeat(60) + '\n';
    report += `Total Tests: ${totalTests}\n`;
    report += `Passed: ${passedTests}\n`;
    report += `Failed: ${failedTests}\n`;
    report += `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`;
    report += '='.repeat(60) + '\n\n';
    
    results.forEach((result, index) => {
      report += `${index + 1}. ${result.testName}: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      report += `   Details: ${result.details}\n`;
      
      if (result.actualValue !== undefined) {
        report += `   Actual Value: ${result.actualValue.toFixed(6)}\n`;
      }
      
      if (result.expectedRange) {
        report += `   Expected Range: ${result.expectedRange.min.toFixed(3)} - ${result.expectedRange.max.toFixed(3)}\n`;
      }
      
      if (result.errors && result.errors.length > 0) {
        report += `   Errors: ${result.errors.join(', ')}\n`;
      }
      
      report += '\n';
    });
    
    return report;
  }
}

// Export for testing
export async function runWeightNormalizationValidation(): Promise<string> {
  const validator = new WeightNormalizationValidator();
  const results = await validator.runAllTests();
  const report = validator.generateTestReport(results);
  
  secureLog.info('Weight Normalization Validation Results:', { 
    totalTests: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length
  });
  
  return report;
}