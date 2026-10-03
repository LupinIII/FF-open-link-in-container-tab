# open-link-in-container-tab

This is a Firefox/Waterfox extension that reports available containers to other extensions and opens URLs in container tabs. The purpose of the extension is to avoid having the `contextualIdentities` permission on other extensions. This is a proof-of-concept extension and not meant to be run as is.

Load the extension as a temporary addon from "Debug Add-ons -> Load Temporary Add-on...". There is an auxiliary extension in the `extension_test` sub-directory (loaded the same way after the primary extension has been loaded) to test the extension.

## Extension `open-link-in-container-tab`

The main extension. The extension listens for two types of messages: `get_containers` and `open_in_container`. The message data can be an object or serialized JSON (`JSON.stringify({....})`). For messages to be accepted the sender's extension ID has to be in the `ALLOWED_SENDERS` array in the main script.

### Message `get_containers`:

Reports back the containers returned by `browser.contextualIdentities.query({})`.

Execute this in another extension:
```javascript
const response = await browser.runtime.sendMessage(
	'open-link-in-container-tab@lupin', {
		action: 'get_containers'
	}
);
```



The response will be the list of available containers with a status and an array of objects like this:
```javascript
{
	ok: true,
	[{
		id: identity.cookieStoreId,
		name: identity.name,
		colorCode: identity.colorCode,
		iconUrl: identity.iconUrl
	 },
	 ....
	]
}
```

### Message `open_in_container`:

Opens a link in a new tab in the specified container.

```javascript
const result = await browser.runtime.sendMessage(
	'open-link-in-container-tab@lupin', {
		action: 'open_in_container',
		url: url_to_open,
		container_id: container.id,
		parent_tab_id: parent_tab.id, // optional
		active: false // optional
	}
);
```

`parent_tab_id` can be specified, but is not necessary, if the current tab should be the parent of the tab to be opened.

`active` is optional. If true or not specified focus will switch to the new tab, otherwise the tab will open in the background.

The response will be an object with a status and the ID of the newly opened tab:

```javascript
{
	ok: true,
	tab_id: tab.id
}
```

## Extension `open-link-in-container-tab-test`

Load this auxiliary extension (its manifest.json is in the `extension_test` subdirectory) after you have loaded the main extension to test the setup. It will open one tab that shows all available containers (including icon and color) and child tabs for every container using the container environment without needing any container permissions itself.

## License

This project is licensed under the **GNU General Public License v3 (GPL-3.0)**.

For the full legal text, please refer to the [LICENSE](LICENSE) file in the root of this repository.