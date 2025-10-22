/**
 * Validation Suite Runner
 * Runs comprehensive validation tests for the musicality scoring fixes
 */

import { runWeightNormalizationValidation } from './weightNormalizationTests';
import { secureLog } from '../../../utils/secureLogger';

export async function runComprehensiveValidationSuite(): Promise<void> {
  console.log('🧪 Starting Comprehensive Musicality Scoring Validation Suite...\n');
  
  try {
    // Run weight normalization and field mapping tests
    const report = await runWeightNormalizationValidation();
    
    // Log to console and secure logger
    console.log(report);
    secureLog.info('Comprehensive validation completed', { timestamp: new Date().toISOString() });
    
    // Check if all tests passed
    const failedTests = report.includes('❌ FAIL');
    
    if (failedTests) {
      console.log('\n🚨 VALIDATION FAILED: Some tests did not pass. Review the report above.');
      secureLog.error('Validation suite failed - critical issues detected');
    } else {
      console.log('\n✅ VALIDATION SUCCESSFUL: All tests passed!');
      secureLog.info('Validation suite passed - all critical issues resolved');
    }
    
  } catch (error) {
    console.error('\n💥 VALIDATION SUITE CRASHED:', error);
    secureLog.error('Validation suite crashed', { error: error instanceof Error ? error.message : String(error) });
  }
}

// Allow direct execution (ES module compatible)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runComprehensiveValidationSuite()
    .then(() => {
      console.log('\n🏁 Validation suite completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}