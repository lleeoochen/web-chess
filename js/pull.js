$(function() {

	if (SCREEN_PORTRAIT) {
		$('body').xpull({
			resistance: 50,
			pullThreshold: 50,
			spinnerTimeout: 0,
			callback: function() {

				$('.pull-indicator').click(function() {
					$(this).css('background-color', '#437149');
					window.location = '';
				});
				// setTimeout(() => {
				// }, 500);
			}
	    });
	}
});
