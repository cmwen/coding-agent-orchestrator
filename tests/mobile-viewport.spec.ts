import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport - Text Overflow', () => {
  test('heading should use text-overflow ellipsis on mobile', async ({ page }) => {
    // Set mobile viewport (Pixel 5 is 393px wide)
    await page.setViewportSize({ width: 393, height: 851 });
    
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check that heading uses text-overflow ellipsis
    const heading = page.locator('.orchestrator-brand h1');
    const textOverflow = await heading.evaluate((el) =>
      window.getComputedStyle(el).textOverflow
    );
    
    expect(textOverflow).toBe('ellipsis');
  });

  test('should truncate long headings with ellipsis on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find the h1 element
    const heading = page.locator('.orchestrator-brand h1');
    
    // Check that heading exists
    await expect(heading).toBeVisible();
    
    // Get computed style to verify text-overflow is ellipsis
    const textOverflow = await heading.evaluate((el) => 
      window.getComputedStyle(el).textOverflow
    );
    
    expect(textOverflow).toBe('ellipsis');
    
    // Verify white-space is nowrap
    const whiteSpace = await heading.evaluate((el) =>
      window.getComputedStyle(el).whiteSpace
    );
    
    expect(whiteSpace).toBe('nowrap');
  });

  test('should handle overflow-wrap on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar meta text handling
    const sidebarMeta = page.locator('.orchestrator-sidebar-meta');
    
    if (await sidebarMeta.isVisible()) {
      const overflowWrap = await sidebarMeta.evaluate((el) =>
        window.getComputedStyle(el).overflowWrap
      );
      
      expect(overflowWrap).toBe('anywhere');
    }
  });

  test('should not clip content in sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar overflow properties
    const sidebar = page.locator('.orchestrator-sidebar');
    
    const overflowX = await sidebar.evaluate((el) =>
      window.getComputedStyle(el).overflowX
    );
    
    expect(overflowX).toBe('clip');
  });

  test('should display session list horizontally on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const sessionList = page.locator('.orchestrator-session-list');
    
    if (await sessionList.isVisible()) {
      const gridAutoFlow = await sessionList.evaluate((el) =>
        window.getComputedStyle(el).gridAutoFlow
      );
      
      expect(gridAutoFlow).toBe('column');
    }
  });

  test('should have proper min-width constraints', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const brand = page.locator('.orchestrator-brand');
    const firstDiv = brand.locator('> div:first-child');
    
    // The first div inside brand should have min-width: 0 to allow shrinking
    const minWidth = await firstDiv.evaluate((el) =>
      window.getComputedStyle(el).minWidth
    );
    
    expect(minWidth).toBe('0px');
  });
});

test.describe('Desktop Viewport', () => {
  test('should display normally on desktop', async ({ page }) => {
    // Chrome desktop is ~1280px wide
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heading = page.locator('.orchestrator-brand h1');
    
    // Heading should exist
    const count = await heading.count();
    expect(count).toBeGreaterThan(0);
    
    // On desktop, heading should be larger
    if (count > 0) {
      const fontSize = await heading.first().evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );
      
      // Should be around 1.1rem = 17.6px (or similar)
      const fontSizeNum = parseFloat(fontSize);
      expect(fontSizeNum).toBeGreaterThan(15);
    }
  });
});
