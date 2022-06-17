var port = 3003;
var toFrameWs=new WebSocket(`ws://localhost:${port}/toFrame`)
var optWs=new WebSocket(`ws://localhost:${port}/optimization`)

toFrameWs.onmessage = function(data){
  console.log(data.data)
  $('#stdout').html(JSON.parse(data.data).data)
}


optWs.onmessage = function (data) {
  var res = JSON.parse(data.data);
 // console.log(data);
  $('h5').html(`处理中：${res.data}`)
  $('#progress').css('width',res.data)
  $('#progress').html(res.data)

  if(res.data=='null'){
    $('#processStop').addClass('disabled')
    $('#processStart').removeClass('disabled')
    $('#processStart').html(`处理`)
    //进程退出操作
    //正常退出
    arProgressing('arLoading','处理完成','fa-check-circle')
    $('#progress').css('width','100%')
    $('#progress').html(`处理完成`)
    $('.ar-line').hide()
     }

  if(data.data=='1'){
      arProgressing('arLoading','人为退出','fa-exclamation-triangle')
      $('.ar-line').hide()
      $('#processStop').attr('disabled','')
    $('#processStart').removeAttr('disabled')
    $('#processStart').html(`处理`)
  }
};

function paused(){
  ws.send(JSON.stringify({kill:true}))
}


function getMedia() {
  var file = $('#inputFile')[0];
  if(!!($('#inputFile')[0].files[0])){
    $('#toFrame').removeAttr('disabled')
    $('#fileName').html(file.files[0].name)
    $('#video').attr('src',file.files[0].path)
  console.log(file.files[0].name)
  $.ajax({
    url:`http://localhost:${port}/getMedia`,
    dataType:'json',
    type:'GET',
    data:{filePath:file.files[0].path},
    success(msg){
      $('#videoInfoJson').html(JSON.stringify(msg, null, '  '))
      var data=msg.media.track[1]
      var temp=`帧率：${data.FrameRate}
            <br>总帧数 ${data.FrameCount}
            <br> 分辨率 ${data.Width}*${data.Height}
            <br> ${data.ColorSpace} / ${data.BitDepth}bit(${data.ChromaSubsampling})`
      $('#vidShortInfo').html(temp)
      window.VideoMediaInfo=msg
      $('#frameControl').attr('max',data.FrameCount)
    }
  })
  }else{
    $('#toFrame').attr('disabled','')
    alert('请选择文件！')
  }
}

var process={
  toFrame:function(){
    toFrameWs.send(JSON.stringify({
      command:true,
      path:$('#filePathText').html()
    }))
  },

  opt:function(){
    $('#processStop').removeAttr('disabled')
    $('#processStart').attr('disabled','')
    arProgressing('arLoading','处理中','fa-info-circle')
    $('#processStop').removeClass('disabled')
    $('#processStart').addClass('disabled')
    $('#processStart').html(`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>处理中`)
  
    optWs.send(JSON.stringify({
      command:true,
      model:$('#model').val().split(',')[1],
      scale:$('#model').val().split(',')[0],
      path:$('#filePathText').html()
    }))
  }


}

  function arProgressing(Class,text,icons){
    arLoadingClass({
        text:text,
        color: '#DDDDDD',
        Class: Class,
        size: '3',
        icon: icons})
}

function frameControl(range) {
  $('#frameView').attr('src',`${$('#filePathText').html()}_tmp_frames/${range.value}.jpg`);
  $('#process').attr('src',`${$('#filePathText').html()}_out_frames/${range.value}.jpg`);
  $('#frameStat').html(`帧号控制器：${range.value}`)
}




function checkUpdate(){
  var count=3;
  $.ajax({
    url:"https://api.arsrna.cn/release/appUpdate/ArESRGAN",
    dataType:'json',
    success(msg){
      console.log(msg)
      $('#updateHistory').html(msg.history)
      if(msg.count>count){
        $('.checkUpdate').show()
       layer.open({
         title:`发现新版本 ${msg.rName} ${msg.vNumber}`,
         content: `更新日期：${msg.uTime} <br>${msg.content}`,
         btn:['前往下载','取消'],
         yes: function(index, layero){
           location.href=msg.link;
         }
       });         
      }else{
       $('.checkUpdate').hide()
         layer.msg('未发现新版本');
      }
    },

    error(msg){
     layer.msg(`检查失败 ${msg}`);
     console.log(msg.statusText);
    }
  })

}

