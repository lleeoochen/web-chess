---
---

var database = new Firebase();
database.login(() => {
	let url = localStorage.getItem(LAST_VISITED_KEY);
	localStorage.removeItem(LAST_VISITED_KEY);

	if (url && !url.includes('login'))
		window.location = url;
	else
		window.location = `{{ baseUrl }}/${ SCREEN_PORTRAIT ? 'mobile' : '' }`;
});
