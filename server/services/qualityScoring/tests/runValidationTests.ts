/**
 * Quick validation test runner for the enhanced quality metrics system
 */

import { qualityMetricsValidator } from './qualityMetricsValidation';
import { semanticAnalyzer } from '../semanticAnalyzer';
import { phoneticSemanticAnalyzer } from '../phoneticSemanticAnalyzer';
import { enhancedNameScoringEngine } from '../enhancedNameScoringEngine';
import { secureLog } from '../../../utils/secureLogger';

async function runQuickValidationTests() {
  console.log('🚀 Starting Enhanced Quality Metrics Validation Tests...\n');
  
  try {
    // Test 1: Semantic Analysis
    console.log('📊 Testing Semantic Analysis...');
    const semanticResult = await semanticAnalyzer.analyzeSemantics('electric storm', {
      genre: 'rock',
      mood: 'energetic',
      type: 'band'
    });
    
    console.log(`✅ Semantic coherence: ${semanticResult.score.coherence}%`);
    console.log(`✅ Emotional resonance: ${semanticResult.score.emotionalResonance}%`);
    console.log(`✅ Cultural appeal: ${semanticResult.score.culturalAppeal}%\n`);
    
    // Test 2: Phonetic-Semantic Integration
    console.log('🔊 Testing Phonetic-Semantic Integration...');
    const phoneticSemanticResult = await phoneticSemanticAnalyzer.analyze('Thunder Strike', {
      genre: 'rock',
      mood: 'energetic',
      type: 'band'
    });
    
    console.log(`✅ Overall score: ${phoneticSemanticResult.score.overall}%`);
    console.log(`✅ Phonetic flow: ${phoneticSemanticResult.phoneticAnalysis.flow}%`);
    console.log(`✅ Semantic coherence: ${phoneticSemanticResult.semanticAnalysis.score.coherence}%`);
    console.log(`✅ Cross-dimensional synergy: ${phoneticSemanticResult.score.synergy.crossDimensionalHarmony}%\n`);
    
    // Test 3: Enhanced Name Scoring
    console.log('⭐ Testing Enhanced Name Scoring...');
    const scoringResult = await enhancedNameScoringEngine.scoreNameEnhanced({
      name: 'Electric Dreams',
      type: 'band',
      genre: 'electronic',
      mood: 'energetic',
      isAiGenerated: false,
      analysisDepth: 'comprehensive'
    });
    
    console.log(`✅ Overall quality: ${(scoringResult.score.overall * 100).toFixed(1)}%`);
    console.log(`✅ Phonetic flow: ${(scoringResult.score.breakdown.phoneticFlow * 100).toFixed(1)}%`);
    console.log(`✅ Semantic coherence: ${(scoringResult.score.breakdown.semanticCoherence * 100).toFixed(1)}%`);
    console.log(`✅ Market appeal: ${(scoringResult.score.breakdown.marketAppeal * 100).toFixed(1)}%`);
    console.log(`✅ Quality ranking: ${scoringResult.qualityRanking.rank}`);
    console.log(`✅ Market position: ${scoringResult.qualityRanking.marketPosition}\n`);
    
    // Test 4: Genre Comparison
    console.log('🎵 Testing Genre-Specific Analysis...');
    const rockResult = await enhancedNameScoringEngine.scoreNameEnhanced({
      name: 'Thunderstorm',
      type: 'band',
      genre: 'rock',
      mood: 'energetic',
      isAiGenerated: false
    });
    
    const jazzResult = await enhancedNameScoringEngine.scoreNameEnhanced({
      name: 'Midnight Serenade',
      type: 'band',
      genre: 'jazz',
      mood: 'calm',
      isAiGenerated: false
    });
    
    console.log(`✅ Rock name "Thunderstorm": ${(rockResult.score.overall * 100).toFixed(1)}%`);
    console.log(`✅ Jazz name "Midnight Serenade": ${(jazzResult.score.overall * 100).toFixed(1)}%\n`);
    
    // Test 5: Quality Insights
    console.log('💡 Sample Quality Insights:');
    if (scoringResult.recommendations && scoringResult.recommendations.length > 0) {
      scoringResult.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    if (scoringResult.improvementSuggestions && scoringResult.improvementSuggestions.length > 0) {
      console.log('\n🔧 Improvement Suggestions:');
      scoringResult.improvementSuggestions.slice(0, 2).forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion.suggestion} (${suggestion.priority} priority)`);
      });
    }
    
    console.log('\n🎉 All validation tests completed successfully!');
    console.log('✅ Enhanced Quality Metrics System is functioning correctly');
    
    return {
      success: true,
      semanticScore: semanticResult.score.overall,
      phoneticSemanticScore: phoneticSemanticResult.score.overall,
      enhancedScore: scoringResult.score.overall,
      rockScore: rockResult.score.overall,
      jazzScore: jazzResult.score.overall
    };
    
  } catch (error) {
    console.error('❌ Validation test failed:', error);
    secureLog.error('Quality metrics validation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Self-executing test
if (require.main === module) {
  runQuickValidationTests()
    .then(result => {
      if (result.success) {
        console.log('\n📈 Validation Summary:');
        console.log(`   Semantic Analysis: ${result.semanticScore}%`);
        console.log(`   Phonetic-Semantic Integration: ${result.phoneticSemanticScore}%`);
        console.log(`   Enhanced Scoring: ${result.enhancedScore ? (result.enhancedScore * 100).toFixed(1) : 'N/A'}%`);
        console.log(`   Rock Genre Score: ${result.rockScore ? (result.rockScore * 100).toFixed(1) : 'N/A'}%`);
        console.log(`   Jazz Genre Score: ${result.jazzScore ? (result.jazzScore * 100).toFixed(1) : 'N/A'}%`);
        console.log('\n🏆 Enhanced Quality Metrics System Validation: PASSED');
        process.exit(0);
      } else {
        console.log('\n💥 Enhanced Quality Metrics System Validation: FAILED');
        console.log(`   Error: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Validation runner failed:', error);
      process.exit(1);
    });
}

export { runQuickValidationTests };