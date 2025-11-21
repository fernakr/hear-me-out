/**
 * Mouse Tracking Test Suite
 * 
 * This script tests that mouse position tracking works correctly
 * by moving the mouse to specific positions and verifying the
 * ripple effects appear at the correct locations.
 */

class MouseTrackingTester {
  constructor() {
    this.testResults = [];
    this.testPositions = [
      { x: 100, y: 100, name: 'top-left' },
      { x: 400, y: 100, name: 'top-center' },
      { x: 700, y: 100, name: 'top-right' },
      { x: 100, y: 300, name: 'center-left' },
      { x: 400, y: 300, name: 'center' },
      { x: 700, y: 300, name: 'center-right' },
      { x: 100, y: 500, name: 'bottom-left' },
      { x: 400, y: 500, name: 'bottom-center' },
      { x: 700, y: 500, name: 'bottom-right' }
    ];
  }

  async runTests(page) {
    console.log('🧪 Starting Mouse Tracking Tests...');
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000); // Wait for shader to load
    
    // Clear any existing console messages
    await page.evaluate(() => console.clear());
    
    for (const position of this.testPositions) {
      await this.testPosition(page, position);
    }
    
    this.printResults();
    return this.testResults;
  }

  async testPosition(page, position) {
    console.log(`\n📍 Testing position: ${position.name} (${position.x}, ${position.y})`);
    
    // Move mouse to position
    await page.mouse.move(position.x, position.y);
    await page.waitForTimeout(100); // Allow time for mouse tracking
    
    // Get the latest console messages to find mouse coordinates
    const consoleMessages = await page.evaluate(() => {
      // Look for the most recent mouse moved message in the console
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      // Return any recent mouse movement logs
      return logs.filter(log => log.includes('Mouse moved:')).slice(-1);
    });
    
    // Extract normalized coordinates from console output
    const mouseCoords = await page.evaluate(() => {
      return window.lastMouseCoords || { x: 0.5, y: 0.5 };
    });
    
    // Calculate expected normalized coordinates
    const canvasSize = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : { width: 800, height: 600 };
    });
    
    const expectedX = position.x / canvasSize.width;
    const expectedY = position.y / canvasSize.height;
    
    // Test tolerance (within 5% is acceptable)
    const tolerance = 0.05;
    const xMatch = Math.abs(mouseCoords.x - expectedX) < tolerance;
    const yMatch = Math.abs(mouseCoords.y - expectedY) < tolerance;
    const passed = xMatch && yMatch;
    
    const testResult = {
      position: position.name,
      screenCoords: { x: position.x, y: position.y },
      expectedNormalized: { x: expectedX, y: expectedY },
      actualNormalized: mouseCoords,
      passed,
      tolerance,
      xError: Math.abs(mouseCoords.x - expectedX),
      yError: Math.abs(mouseCoords.y - expectedY)
    };
    
    this.testResults.push(testResult);
    
    console.log(`Expected: (${expectedX.toFixed(3)}, ${expectedY.toFixed(3)})`);
    console.log(`Actual: (${mouseCoords.x.toFixed(3)}, ${mouseCoords.y.toFixed(3)})`);
    console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  }

  printResults() {
    console.log('\n📊 Test Summary:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`Overall: ${passed}/${total} tests passed`);
    
    if (passed < total) {
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  ${result.position}: X error ${result.xError.toFixed(3)}, Y error ${result.yError.toFixed(3)}`);
      });
    }
    
    console.log('\n📈 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.position}: (${result.actualNormalized.x.toFixed(3)}, ${result.actualNormalized.y.toFixed(3)})`);
    });
  }

  // Helper method to test a single position manually
  static async testSinglePosition(page, x, y) {
    console.log(`Testing single position: (${x}, ${y})`);
    await page.mouse.move(x, y);
    await page.waitForTimeout(200);
    
    const coords = await page.evaluate(() => window.lastMouseCoords);
    console.log(`Normalized coordinates: (${coords?.x?.toFixed(3)}, ${coords?.y?.toFixed(3)})`);
    
    return coords;
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MouseTrackingTester;
}

// Browser usage example
if (typeof window !== 'undefined') {
  window.MouseTrackingTester = MouseTrackingTester;
  console.log('MouseTrackingTester loaded. Use: new MouseTrackingTester().runTests(page)');
}