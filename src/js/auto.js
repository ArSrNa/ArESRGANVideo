var attoFrameWs = new WebSocket(`ws://localhost:${port}/toFrame`),
	atoptWs = new WebSocket(`ws://localhost:${port}/optimization`),
	attoVideoWs = new WebSocket(`ws://localhost:${port}/toVideo`);


var AutoProcess = {
	toFrame: function() {
		attoFrameWs.send(JSON.stringify({
			command: true,
			path: $('#filePathText')
				.html()
		}))
	},

	opt: function() {
		atoptWs.send(JSON.stringify({
			command: true,
			model: $('#AutoModel')
				.val()
				.split(',')[1],
			scale: $('#AutoModel')
				.val()
				.split(',')[0],
			path: $('#filePathText')
				.html()
		}))
	},

	toVideo: function() {
		attoVideoWs.send(JSON.stringify({
			command: true,
			frameRate: VideoMediaInfo.media.track[1].FrameRate,
			path: $('#filePathText')
				.html(),
			codec: $('#codec')
				.val(),
		}))
	}
}

// attoFrameWs.onmessage=function(data){
//   console.log(data)
// }

function autoProgress(data, pstep, stepName) {
	var res = JSON.parse(data.data);
	$('#autoLogs')
		.html(res.data);
	$(`#autoStep${pstep}`)
		.css('color', 'red');
	//console.log(res);
	step = 'toFrame';
	if (res.type == 'exit') {
		console.log(`已退出step${pstep}`)
		$(`#autoStep${pstep}`)
			.css('color', 'green');
		$(`#autoStep${pstep}`)
			.html(`结束 ${stepName}`);
		return true;
	}
}


attoFrameWs.onmessage = function(data) {
	if (autoProgress(data, 1, '视频转化为帧')) {
		AutoProcess.opt()
	}
}


atoptWs.onmessage = function(data) {
	if (autoProgress(data, 2, '帧增强')) {
		AutoProcess.toVideo()
	}
};

attoVideoWs.onmessage = function(data) {
	if (autoProgress(data, 3, '帧合成为视频')) {
		alert('处理完成')
		$('#autoPause')
			.addClass('disabled');
		$('#autoStart')
			.removeClass('disabled');
	}
}

function linkStart() {
	AutoProcess.toFrame()
	$('#autoStart')
		.addClass('disabled');
	$('#autoPause')
		.removeClass('disabled');
}

function linkPause() {
	$('#autoPause')
		.addClass('disabled');
	$('#autoStart')
		.removeClass('disabled');
	switch (step) {
		case 'toFrame':
			attoFrameWs.send(JSON.stringify({
				command: 'exit'
			}))
			break;

		case 'opt':
			atoptWs.send(JSON.stringify({
				command: 'exit'
			}))
			break;

		case 'toVideo':
			attoVideoWs.send(JSON.stringify({
				command: 'exit'
			}))
			break
	}
}