'use strict';

const TARGET_EXTENSION_ID = 'open-link-in-container-tab@lupin';
const TEST_URL = browser.runtime.getURL('test.html');

let resolve_test_page_ready; // will be set to the resolve function a the following Promise

const test_page_ready = new Promise(resolve => {
	resolve_test_page_ready = resolve;
});

browser.runtime.onMessage.addListener((message, sender) => {
	if (message === 'ready') {
		// DOM of the tab is ready
		resolve_test_page_ready(sender.tab.id); // resolve the Promise
	}
});

async function main() {
	// open a new foreground tab; will be the parent
	const parent_tab = await browser.tabs.create({
		url: TEST_URL,
		active: true // foreground tab
	});
	console.log('[M][D] parent_tab:', parent_tab);

	// get available containers from external extension
	const response = await browser.runtime.sendMessage(
		TARGET_EXTENSION_ID, {
			action: 'get_containers'
		}
	);
	if (!response.ok) {
		console.error('[M][E] container query failed:', response.error);
		return;
	}
	console.log('[M][D] available containers:', response.containers);

	await test_page_ready; // wait for test page DOM of parent tab to be ready
	// send list of containers to parent tab for display
	await browser.tabs.sendMessage(parent_tab.id, {
		containers: response.containers
	});

	// open a tab for every container.
	for (const container of response.containers) {
		// send request to open tab to external extension
		const result = await browser.runtime.sendMessage(
			TARGET_EXTENSION_ID,
			{
				action: 'open_in_container',
				url: `${TEST_URL}?container=${container.name}`, // append the container name so we can show it in HTML
				container_id: container.id,
				// parent_tab_id: parent_tab.id, // can be specified, but is not necessary if the current tab should be the parent
				active: false // background tab
			}
		);
		console.log('[M][I] opened container:', container.name, container.id, result);
	}
}

main().catch(error => {
	console.error('[M][E] test failed:', error);
});
