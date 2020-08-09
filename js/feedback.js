---
---
var database = new Firebase();


database.getInbox().then(res => {
	let userMapping = {};

	res.data.forEach(data => {
		if (!userMapping[data.email])
			userMapping[data.email] = [];
		userMapping[data.email].push(data.message);
	});

	for (let user in userMapping) {
		let feedbacks = userMapping[user];
		console.log(feedbacks);

		$('#feedback-list').append(
			`<div class="user">${ user }</div>`,

			feedbacks.map(feedback => {
				return `<div class="feedback">${ feedback }</div>`;
			})
		);
	}

});
