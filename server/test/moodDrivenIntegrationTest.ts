/**
 * Integration Test for Mood-Driven Pattern Selection System
 * Tests the complete workflow from mood classification to pattern selection
 */

import { moodClassificationSystem } from '../services/nameGeneration/moodClassificationSystem';
import { patternMoodMapper } from '../services/nameGeneration/patternMoodMapper';
import { contextualMoodSelector } from '../services/nameGeneration/contextualMoodSelector';
import { atmosphericIntelligence } from '../services/nameGeneration/atmosphericIntelligence';
import { patternSelectionEngine } from '../services/nameGeneration/patternSelectionEngine';
import { advancedPatternLibrary } from '../services/nameGeneration/advancedPatternLibrary';

// Test configuration
interface MoodTestCase {
  name: string;
  mood: string;
  expectedPatternTypes: string[];
  atmosphericContext?: any;
  shouldPass: boolean;
}

const testCases: MoodTestCase[] = [
  {
    name: 'Euphoric mood selection',
    mood: 'euphoric',
    expectedPatternTypes: ['dynamic', 'celestial', 'powerful'],
    shouldPass: true
  },
  {
    name: 'Melancholic mood selection',
    mood: 'melancholic',
    expectedPatternTypes: ['temporal', 'introspective', 'poetic'],
    shouldPass: true
  },
  {
    name: 'Mysterious mood with atmospheric context',
    mood: 'mysterious',
    expectedPatternTypes: ['abstract', 'symbolic', 'enigmatic'],
    atmosphericContext: {
      timeContext: 'midnight',
      weather: 'foggy',
      culturalVibe: 'eastern'
    },
    shouldPass: true
  },
  {
    name: 'Invalid mood handling',
    mood: 'nonexistent_mood',
    expectedPatternTypes: [],
    shouldPass: false
  }
];

// Enhanced word source for testing
const testWordSource = {
  validNouns: ['shadow', 'light', 'dream', 'fire', 'water', 'storm', 'whisper', 'echo'],
  validAdjectives: ['dark', 'bright', 'mysterious', 'powerful', 'gentle', 'fierce'],
  validVerbs: ['flowing', 'burning', 'whisper', 'thunder', 'dance', 'soar'],
  validAdverbs: ['silently', 'powerfully', 'gently', 'wildly'],
  selectedCategories: ['nature', 'emotion', 'power', 'mystery']
};

async function runMoodDrivenIntegrationTests(): Promise<{
  success: boolean;
  results: any[];
  summary: string;
}> {
  console.log('🎵 Starting Mood-Driven Pattern Selection Integration Tests...\n');
  
  const results: any[] = [];
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Mood Classification System
  console.log('📊 Testing Mood Classification System...');
  try {
    const moodProfile = moodClassificationSystem.getMoodProfile('euphoric');
    const moodExists = !!moodProfile;
    
    results.push({
      test: 'Mood Classification System',
      passed: moodExists,
      details: moodExists ? `Found mood profile for 'euphoric'` : 'Failed to find mood profile'
    });
    
    if (moodExists) passedTests++;
    totalTests++;
    
    console.log(`✅ Mood Classification System: ${moodExists ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.push({
      test: 'Mood Classification System',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ Mood Classification System: FAILED - ${error}`);
  }

  // Test 2: Pattern-Mood Mapping
  console.log('\n🎯 Testing Pattern-Mood Mapping...');
  try {
    const testPatterns = advancedPatternLibrary.getAllPatterns(2).slice(0, 3);
    if (testPatterns.length > 0) {
      const moodScore = patternMoodMapper.scorePatternForMood(testPatterns[0], 'euphoric');
      const mappingWorks = moodScore && typeof moodScore.overallScore === 'number';
      
      results.push({
        test: 'Pattern-Mood Mapping',
        passed: mappingWorks,
        details: mappingWorks ? `Pattern scored: ${moodScore.overallScore}` : 'Failed to score pattern'
      });
      
      if (mappingWorks) passedTests++;
      totalTests++;
      
      console.log(`✅ Pattern-Mood Mapping: ${mappingWorks ? 'PASSED' : 'FAILED'}`);
    } else {
      results.push({
        test: 'Pattern-Mood Mapping',
        passed: false,
        details: 'No patterns available for testing'
      });
      totalTests++;
      console.log('❌ Pattern-Mood Mapping: FAILED - No patterns available');
    }
  } catch (error) {
    results.push({
      test: 'Pattern-Mood Mapping',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ Pattern-Mood Mapping: FAILED - ${error}`);
  }

  // Test 3: Contextual Mood Selection
  console.log('\n🎭 Testing Contextual Mood Selection...');
  try {
    const generationContext = {
      primaryMood: 'mysterious',
      genre: 'electronic',
      type: 'band' as const,
      wordCount: 2,
      timeContext: 'midnight',
      weather: 'foggy'
    };
    
    const contextAnalysis = contextualMoodSelector.analyzeContext(generationContext);
    const contextWorks = contextAnalysis && contextAnalysis.detectedMoods.length > 0;
    
    results.push({
      test: 'Contextual Mood Selection',
      passed: contextWorks,
      details: contextWorks ? `Detected ${contextAnalysis.detectedMoods.length} moods` : 'Failed to analyze context'
    });
    
    if (contextWorks) passedTests++;
    totalTests++;
    
    console.log(`✅ Contextual Mood Selection: ${contextWorks ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.push({
      test: 'Contextual Mood Selection',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ Contextual Mood Selection: FAILED - ${error}`);
  }

  // Test 4: Atmospheric Intelligence
  console.log('\n🌤️ Testing Atmospheric Intelligence...');
  try {
    const atmosphericContext = {
      timeContext: 'midnight' as const,
      weather: 'stormy' as const,
      culturalVibe: 'nordic' as const
    };
    
    const atmosphericAnalysis = atmosphericIntelligence.analyzeAtmosphericContext(atmosphericContext);
    const atmosphericWorks = atmosphericAnalysis && atmosphericAnalysis.atmosphericMoods.length > 0;
    
    results.push({
      test: 'Atmospheric Intelligence',
      passed: atmosphericWorks,
      details: atmosphericWorks ? `Found ${atmosphericAnalysis.atmosphericMoods.length} atmospheric moods` : 'Failed to analyze atmosphere'
    });
    
    if (atmosphericWorks) passedTests++;
    totalTests++;
    
    console.log(`✅ Atmospheric Intelligence: ${atmosphericWorks ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.push({
      test: 'Atmospheric Intelligence',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ Atmospheric Intelligence: FAILED - ${error}`);
  }

  // Test 5: Enhanced Pattern Selection Engine
  console.log('\n🔧 Testing Enhanced Pattern Selection Engine...');
  try {
    // Enable mood-driven mode
    patternSelectionEngine.enableMoodDrivenMode(true);
    
    const criteria = {
      wordCount: 2,
      primaryMood: 'euphoric',
      genre: 'electronic',
      type: 'band' as const,
      moodIntensity: 80,
      emotionalDirection: 'uplifting' as const
    };
    
    const selectedPattern = patternSelectionEngine.selectPattern(criteria, testWordSource);
    const selectionWorks = !!selectedPattern;
    
    results.push({
      test: 'Enhanced Pattern Selection Engine',
      passed: selectionWorks,
      details: selectionWorks ? `Selected pattern: ${selectedPattern.id}` : 'Failed to select pattern'
    });
    
    if (selectionWorks) passedTests++;
    totalTests++;
    
    console.log(`✅ Enhanced Pattern Selection Engine: ${selectionWorks ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.push({
      test: 'Enhanced Pattern Selection Engine',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ Enhanced Pattern Selection Engine: FAILED - ${error}`);
  }

  // Test 6: End-to-End Mood-Driven Workflow
  console.log('\n🔄 Testing End-to-End Mood-Driven Workflow...');
  try {
    const criteria = {
      wordCount: 2,
      primaryMood: 'mysterious',
      secondaryMoods: ['dark', 'contemplative'],
      atmosphericContext: {
        timeContext: 'midnight' as const,
        weather: 'foggy' as const,
        culturalVibe: 'eastern' as const
      },
      genre: 'ambient',
      type: 'band' as const,
      emotionalDirection: 'introspective' as const
    };
    
    const moodRecommendations = patternSelectionEngine.getMoodDrivenRecommendations(criteria, testWordSource);
    const workflowWorks = moodRecommendations && moodRecommendations.recommended.length > 0;
    
    results.push({
      test: 'End-to-End Mood-Driven Workflow',
      passed: workflowWorks,
      details: workflowWorks ? `Generated ${moodRecommendations.recommended.length} recommendations` : 'Failed to generate recommendations'
    });
    
    if (workflowWorks) passedTests++;
    totalTests++;
    
    console.log(`✅ End-to-End Mood-Driven Workflow: ${workflowWorks ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    results.push({
      test: 'End-to-End Mood-Driven Workflow',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    totalTests++;
    console.log(`❌ End-to-End Mood-Driven Workflow: FAILED - ${error}`);
  }

  // Generate summary
  const successRate = Math.round((passedTests / totalTests) * 100);
  const summary = `Integration Test Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`;
  
  console.log(`\n📋 ${summary}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Mood-driven pattern selection system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the implementation.');
  }

  return {
    success: passedTests === totalTests,
    results,
    summary
  };
}

// Export for testing
export { runMoodDrivenIntegrationTests };

// Auto-run tests when imported
runMoodDrivenIntegrationTests()
  .then(result => {
    console.log('\n✅ Integration test completed');
  })
  .catch(error => {
    console.error('❌ Integration test failed:', error);
  });