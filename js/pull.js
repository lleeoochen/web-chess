$(function() {
	if (SCREEN_PORTRAIT) {
		const ptr = PullToRefresh.init({
			mainElement: 'body',
			refreshTimeout: 100,
			instructionsPullToRefresh: 'Refresh?',
			instructionsReleaseToRefresh: 'Refresh?',
			onRefresh() {
				window.location.reload();
			}
		});
	}
});
