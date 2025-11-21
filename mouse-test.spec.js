// Mouse tracking test using Playwright
// Run with: npx playwright test mouse-test.spec.js

import { test, expect } from '@playwright/test';

test('mouse tracking accuracy test', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    // Wait for shader to load
    await page.waitForTimeout(2000);

    console.log('🧪 Starting Mouse Tracking Test...\n');

    // Test positions with expected normalized coordinates (tolerance of 0.05)
    const testPositions = [
        { screen: { x: 100, y: 100 }, expected: { x: 0.12, y: 0.13 }, name: 'top-left' },
        { screen: { x: 427, y: 100 }, expected: { x: 0.50, y: 0.13 }, name: 'top-center' },
        { screen: { x: 750, y: 100 }, expected: { x: 0.88, y: 0.13 }, name: 'top-right' },
        { screen: { x: 100, y: 394 }, expected: { x: 0.12, y: 0.50 }, name: 'center-left' },
        { screen: { x: 427, y: 394 }, expected: { x: 0.50, y: 0.50 }, name: 'center' },
        { screen: { x: 750, y: 394 }, expected: { x: 0.88, y: 0.50 }, name: 'center-right' },
        { screen: { x: 100, y: 700 }, expected: { x: 0.12, y: 0.89 }, name: 'bottom-left' },
        { screen: { x: 427, y: 700 }, expected: { x: 0.50, y: 0.89 }, name: 'bottom-center' },
        { screen: { x: 750, y: 700 }, expected: { x: 0.88, y: 0.89 }, name: 'bottom-right' }
    ];

    const tolerance = 0.05;
    let passedTests = 0;

    for (const testPos of testPositions) {
        // Move mouse to position
        await page.mouse.move(testPos.screen.x, testPos.screen.y);
        await page.waitForTimeout(100); // Allow tracking to update

        // Get actual coordinates from the global variable
        const actualCoords = await page.evaluate(() => {
            return window.lastMouseCoords || { x: 0.5, y: 0.5 };
        });

        // Calculate errors
        const xError = Math.abs(actualCoords.x - testPos.expected.x);
        const yError = Math.abs(actualCoords.y - testPos.expected.y);
        const xPass = xError < tolerance;
        const yPass = yError < tolerance;
        const passed = xPass && yPass;

        if (passed) passedTests++;

        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testPos.name}:`);
        console.log(`  Screen: (${testPos.screen.x}, ${testPos.screen.y})`);
        console.log(`  Expected: (${testPos.expected.x.toFixed(3)}, ${testPos.expected.y.toFixed(3)})`);
        console.log(`  Actual: (${actualCoords.x.toFixed(3)}, ${actualCoords.y.toFixed(3)})`);
        console.log(`  Error: X=${xError.toFixed(3)}, Y=${yError.toFixed(3)}`);
        console.log('');

        if (!passed) {
            console.log(`❌ FAILED: Expected coordinates within ${tolerance} tolerance`);
        }
    }

    console.log(`\n📊 Summary: ${passedTests}/${testPositions.length} tests passed`);

    // Expect at least 80% of tests to pass
    expect(passedTests).toBeGreaterThanOrEqual(Math.floor(testPositions.length * 0.8));
});

test('visual ripple tracking test', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('🎨 Testing visual ripple effects...\n');

    // Test specific positions and take screenshots
    const visualTests = [
        { x: 200, y: 200, name: 'top-left-ripple' },
        { x: 600, y: 200, name: 'top-right-ripple' },
        { x: 400, y: 400, name: 'center-ripple' },
        { x: 200, y: 600, name: 'bottom-left-ripple' },
        { x: 600, y: 600, name: 'bottom-right-ripple' }
    ];

    for (const test of visualTests) {
        await page.mouse.move(test.x, test.y);
        await page.waitForTimeout(300); // Wait for ripple effect

        // Take a screenshot
        await page.screenshot({
            path: `test-results-${test.name}.png`,
            fullPage: false
        });

        console.log(`📸 Screenshot taken for ${test.name} at (${test.x}, ${test.y})`);
    }

    console.log('\n✅ Visual test complete. Check screenshots for ripple positioning.');
});

module.exports = {};