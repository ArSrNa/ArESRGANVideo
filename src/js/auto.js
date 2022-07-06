var attoFrameWs=new WebSocket(`ws://localhost:${port}/toFrame`),
  atoptWs=new WebSocket(`ws://localhost:${port}/optimization`),
  attoVideoWs=new WebSocket(`ws://localhost:${port}/toVideo`);


  attoFrameWs.onmessage = function(data){
    var res = JSON.parse(data.data).data;
    $('#autoLogs').html(res.data);
    $('#autoStep1').css('color','red');
    if(res=='exit0'){
      $('#autoStep1').css('color','green');
      $('#autoStep1').html('视频转化为帧成功');
      AutoProcess.opt()
    }
  }
  
  attoVideoWs.onmessage = function(data) {
    console.log(data.data);
    var res = JSON.parse(data.data);
    $('#autoLogs').html(res.data);
    $('#autoStep3').css('color','red');
    if(res.data=='exit0'){
      $('#autoStep3').css('color','green');
      $('#autoStep1').html('转换为视频成功');
    }else{
      $('#autoStep3').css('color','red');
      $('#autoStep3').html('转换为视频时出现错误');
    }
  }
  
  
  atoptWs.onmessage = function (data) {
    var res = JSON.parse(data.data);
    $('#autoStep2').css('color','red');
    $('#autoLogs').html(res.data);
    if(res.type=='exit'){
      $('#autoLogs').html(res.data);
      $('#autoStep2').css('color','green');
      $('#autoStep2').html('增强视频帧成功');
      AutoProcess.toVideo()
    }
    if(res.data=='exit0'){
      $('#autoStep2').css('color','red');
      $('#autoStep2').html('增强视频帧时出现错误');
       }
  };
  

    
    
  function autoPaused(){
    ws.send(JSON.stringify({kill:true}))
    return('停止成功');
  }

  var AutoProcess={
    toFrame:function(){
      attoFrameWs.send(JSON.stringify({
        command:true,
        path:$('#filePathText').html()
      }))
    },
  
    opt:function(){
      atoptWs.send(JSON.stringify({
        command:true,
        model:$('#model').val().split(',')[1],
        scale:$('#model').val().split(',')[0],
        path:$('#filePathText').html()
      }))
    },
  
    toVideo:function(){
      attoVideoWs.send(JSON.stringify({
        command:true,
        frameRate:VideoMediaInfo.media.track[1].FrameRate,
        path:$('#filePathText').html(),
        codec:$('#codec').val(),
      }))
    }
  }

  function linkStart(){
    AutoProcess.toFrame()
  }


  /* 
  attoFrameWs.send(JSON.stringify({command:'exit'}))
    atoptWs.send(JSON.stringify({command:'exit'}))
    attoVideoWs.send(JSON.stringify({command:'exit'}))
  
  停止专用
    */