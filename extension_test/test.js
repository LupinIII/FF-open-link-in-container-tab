'use strict';

const status = document.getElementById('status');
const container_list = document.getElementById('container_list');
const container_name = new URLSearchParams(window.location.search).get('container');

browser.runtime.onMessage.addListener(message => {
	if (message.containers) {
		container_list.innerHTML = '';
		container_list.style.listStyle = 'none';
		container_list.style.display = 'inline-block';
		container_list.style.padding = '0';
		container_list.style.marginTop = '0';

		for (const container of message.containers) {
			const item = document.createElement('li');
			item.style.border = `2px solid ${container.colorCode}`;
			item.style.borderRadius = '8px';
			item.style.padding = '6px 10px';
			item.style.marginBottom = '6px';
			item.style.display = 'flex';
			item.style.alignItems = 'center';
			item.style.gap = '8px';

			const icon = document.createElement('img');
			icon.src = container.iconUrl;
			icon.alt = '';
			icon.width = 20;
			icon.height = 20;

			const name = document.createElement('span');
			name.textContent = `${container.name} (${container.id})`;

			item.appendChild(icon);
			item.appendChild(name);

			container_list.appendChild(item);
		}

		status.textContent = `Found ${message.containers.length} container(s).`;
		return;
	}
});

if (container_name) {
	document.getElementById('tab_type').textContent = `Tab for container: ${container_name}`;
	document.querySelector('h3').textContent = '';
	status.textContent = '';
}

browser.runtime.sendMessage('ready');