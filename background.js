'use strict';

const ALLOWED_SENDERS = new Set([
	'{506e023c-7f2b-40a3-8066-bc5deb40aebe}', // Gesturefy
	'open-link-in-container-tab-test@lupin'
]);

browser.runtime.onMessageExternal.addListener(async (message, sender) => {
	console.log(`[M][D] received message from ${sender.id}:\n${message}`);

	if (!ALLOWED_SENDERS.has(sender.id)) {
		console.error(`[M][E] unauthorized sender ${sender.id}`);
		return { ok: false, error: 'unauthorized sender' };
	}

	try {
		if (typeof message === 'string') {
			message = JSON.parse(message);
		}
	} catch (e) {
		console.error(`[M][E] JSON parse error ${e}`);
		return { ok: false, error: 'malformed JSON message' };
	}

	if (!message || typeof message.action !== 'string') {
		console.error('[M][E] invalid message format');
		return { ok: false, error: 'invalid message format' };
	}

	if (message.action === 'get_containers') {
		console.log('[G][D] received "get_containers"');
		return await get_containers();
	}

	if (message.action === 'open_in_container') {
		console.log('[O][D] received "open_in_container"');
		return await open_in_container(message);
	}

	return { ok: false, error: `unknown message action: ${message.action}` };
});

async function get_containers() {
	try {
		const identities = await browser.contextualIdentities.query({});
		console.log('[G][D] contextualIdentities:', identities);
		return {
			ok: true,
			containers: identities.map(identity => ({
				id: identity.cookieStoreId,
				name: identity.name,
				colorCode: identity.colorCode,
				iconUrl: identity.iconUrl
			}))
		};
	} catch (e) {
		console.error(`[G][E] error ${e}`);
		return { ok: false, error: String(e) };
	}
}

async function open_in_container(message) {
	if (typeof message.url !== 'string' ||
		typeof message.container_id !== 'string') {
		return { ok: false, error: 'open_in_container requires url and container_id' };
	}

	try {
		let tab_options = {
			url: message.url,
			cookieStoreId: message.container_id,
			active: (typeof message.active !== 'boolean' || message.active) ? true : false
		};

		if (Number.isInteger(message.parent_tab_id)) {
			// if a tab ID was sent, use that
			tab_options.openerTabId = message.parent_tab_id;
		} else {
			// try to find current active tab ID
			const tabs = await browser.tabs.query({ active: true, currentWindow: true });
			console.log('[O][D] tabs:', tabs);
			if (tabs[0]) {
				// If an active tab was found, set it as the parent/opener
				tab_options.openerTabId = tabs[0].id;
			}
		}
		console.log('[O][D] tab_options:', tab_options);

		const tab = await browser.tabs.create(tab_options)
		return {
			ok: true,
			tab_id: tab.id
		};
	} catch (e) {
		console.error(`[O][E] error ${e}`);
		return { ok: false, error: String(e) };
	}
}