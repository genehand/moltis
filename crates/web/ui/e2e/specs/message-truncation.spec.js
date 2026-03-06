const { expect, test } = require("../base-test");
const { navigateAndWait, waitForWsConnected, watchPageErrors } = require("../helpers");

test.describe("message truncation", () => {
	test.beforeEach(async ({ page }) => {
		await navigateAndWait(page, "/chats/main");
		await waitForWsConnected(page);
	});

	test("long assistant messages show a More button that expands content", async ({ page }) => {
		const errors = watchPageErrors(page);

		// Inject a long assistant message directly into the chat
		const longContent = "A".repeat(1000);
		await page.evaluate((content) => {
			// Create a mock assistant message element
			var msgBox = document.getElementById("messages");
			var msgEl = document.createElement("div");
			msgEl.className = "msg assistant";
			msgEl.innerHTML = content;
			msgBox.appendChild(msgEl);

			// Apply truncation
			var { applyMessageTruncation } = require("./js/chat-ui.js");
			applyMessageTruncation(msgEl, content);
		}, longContent);

		// Wait for the message to be rendered
		const msg = page.locator(".msg.assistant").last();
		await expect(msg).toBeVisible();

		// Check that the More button is present for long messages
		const moreBtn = msg.locator(".msg-more-btn");
		await expect(moreBtn).toBeVisible();
		await expect(moreBtn).toHaveText("More");

		// Check that content is wrapped in truncated container
		const contentWrapper = msg.locator(".msg-content-wrapper.msg-content-truncated");
		await expect(contentWrapper).toBeVisible();

		// Click More button to expand
		await moreBtn.click();

		// Verify the content is now expanded
		await expect(contentWrapper).toHaveClass(/msg-content-expanded/);
		await expect(moreBtn).toHaveText("Less");
		await expect(moreBtn).toHaveClass(/expanded/);

		// Click again to collapse
		await moreBtn.click();

		// Verify it's collapsed again
		await expect(contentWrapper).not.toHaveClass(/msg-content-expanded/);
		await expect(moreBtn).toHaveText("More");
		await expect(moreBtn).not.toHaveClass(/expanded/);

		expect(errors).toHaveLength(0);
	});

	test("short assistant messages do not show a More button", async ({ page }) => {
		const errors = watchPageErrors(page);

		// Inject a short assistant message
		const shortContent = "Short response";
		await page.evaluate((content) => {
			var msgBox = document.getElementById("messages");
			var msgEl = document.createElement("div");
			msgEl.className = "msg assistant";
			msgEl.textContent = content;
			msgBox.appendChild(msgEl);

			// Apply truncation (should not add button for short content)
			var { applyMessageTruncation } = require("./js/chat-ui.js");
			applyMessageTruncation(msgEl, content);
		}, shortContent);

		// Wait for the message to be rendered
		const msg = page.locator(".msg.assistant").last();
		await expect(msg).toBeVisible();

		// Verify no More button for short messages
		const moreBtn = msg.locator(".msg-more-btn");
		await expect(moreBtn).not.toBeVisible();

		// Verify no content wrapper was added
		const contentWrapper = msg.locator(".msg-content-wrapper");
		await expect(contentWrapper).not.toBeVisible();

		expect(errors).toHaveLength(0);
	});
});
