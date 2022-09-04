if(localStorage.getItem('serverIP')==null){
    layer.prompt({
        title: '首次配置，请输入服务器IP及端口', 
        value:'127.0.0.1:3003'
    }, function(msg, index){
        localStorage.setItem('serverIP',msg)
        layer.msg(`设置成功：${msg}`)
        layer.close(index);
        location.reload();
      });
}else{
    window.server=localStorage.getItem('serverIP')
    $('.serverIP').html(server)
}

function getTaskBaseInfo(){
    $.ajax({
        url:'',
        success(msg){
            var baseInfoTemp
        }
    })
}

function changeBg(url,select,defaultBg) {
    if(defaultBg){
      //选择默认背景时
      $("#bgFilePath").html('res/index.png');
      localStorage.setItem('backgroundURL','res/index.png');
    }else{
       $("#bgFilePath").html(url);
       localStorage.setItem('backgroundURL',url);
    }
    localStorage.setItem('backgroundSwitch',select);
    location.reload()
  }

  function startChangeBg() {
    var url = localStorage.getItem('backgroundURL'),
        open = localStorage.getItem('backgroundSwitch');
        //背景设置部分
    if(open=='true'){
      $("#bgFilePath").html(url);
      $("#bgSwitch")[0].checked = true;
      $('.backgroundImg').attr('src',url)
    }else{
      $(".backgroundImg").remove();
      $("#bgSwitch")[0].checked = false;
    }
  }

var cpuChart = echarts.init(document.getElementById('cpuUsage')),
    memChart = echarts.init(document.getElementById('memUsage'));
cpuChart.setOption({
  tooltip: {
    formatter: '{a} <br/>{b} : {c}%'
  },
  series: [
    {
      name: 'CPU使用',
      type: 'gauge',
      progress: {
        show: true
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}'
      },
      data: [
        {
          value: 90,
          name: 'CPU'
        }
      ]
    }
  ]
});