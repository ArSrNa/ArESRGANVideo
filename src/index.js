const { app, BrowserWindow} = require('electron'),
      path = require('path'),
      eapp = require('express')(),
      expressWs = require('express-ws')
      mediainfo = require('node-mediainfo'),
      elecreload = require('electron-reload'),
      spawn = require('child_process').spawn;
      fs=require('fs');
      port = 3003;

expressWs(eapp)


//elecreload(__dirname);
// elecreload( path.resolve('.') , {
//   electron: require(`${ path.resolve('.') }/node_modules/electron`)
// });

/* 2022-6-17
   Powered by Ar-Sr-Na
              ArSrNaRenderInfinity
              ArSrNaESRGAN

    Hope you enjoy it!!
*/

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
eapp.get('/getMedia',function(req,res){
  var path = req.query.filePath
  mediaInfo(path,res)
})

async function mediaInfo(adr,res){
  const result = await mediainfo(adr);
  console.log(JSON.stringify(result))
  res.send(JSON.stringify(result))
} 


eapp.ws('/toFrame',function(ws,req){
  ws.on('message',function(data){
    var res = JSON.parse(data);
    console.log(data)
    toFrame(ws,res,['-i',res.path,'-qscale:v',1,'-qmin',1,'-vsync',0,`${res.path}_tmp_frames/%0d.jpg`,'-loglevel','info'])
  })
})

eapp.ws('/optimization',function(ws,req){
  ws.on('message',(data)=>{
    var res = JSON.parse(data);
    console.log(data)
    optimization(ws,res,
      ['-i',`${res.path}_tmp_frames`,
       '-o',`${res.path}_out_frames`,
       '-n',res.model,
       '-s',res.scale,
       '-f','jpg'])
  })
})

function toFrame(ws,res,args){
  if(res.command) {
    fs.mkdir(`${res.path}_tmp_frames/`,function(err){
      if(err) console.error(err);
      console.log('创建目录成功_tmp');
    });
    console.log('执行命令toFrame')
    ffmpeg=spawn(`${__dirname}/backres/ffmpeg.exe`,args)

    ffmpeg.stdout.on('data', function (data) { 
      console.log(data.toString('utf8'))
      ws.send(JSON.stringify({
        type:'stdout',
        data:data.toString('utf8')
      }))
    }); 

    ffmpeg.stderr.on('data', function (data) { 
      console.log(data.toString('utf8'))
      ws.send(JSON.stringify({
        type:'stderr',
        data:data.toString('utf8')
      }))
    })

    ffmpeg.on('exit', function (code, signal) { 
      console.log('child process eixt ,exit:' + code); 
      ws.send(JSON.stringify({
        type:'exit',
        data:'FFMPEG程序已退出'
      }))
      return code
      })
  }
}



function optimization(ws,res,args) {
  if(res.command==true) {
  esgan=spawn(`${__dirname}/backres/realesrgan-ncnn-vulkan.exe`,args)
  fs.mkdir(`${res.path}_out_frames/`,function(err){
    if(err) console.error(err);
    console.log('创建目录成功_out');
    console.log('执行命令增强')
  });
  
  esgan.stdout.on('data', function (data) { 
    console.log(data.toString('utf8'))
    ws.send(JSON.stringify({
      type:'stdout',
      data:data.toString('utf8')
    }))
  }); 

  esgan.stderr.on('data', function (data) { 
    console.log(data.toString('utf8'))
    ws.send(JSON.stringify({
      type:'stderr',
      data:data.toString('utf8')
    }))
  })

  esgan.on('exit', function (code, signal) { 
    console.log('child process eixt ,exit:' + code); 
    ws.send(JSON.stringify({
      type:'exit',
      data:code
    }))
    return code
    })


  }else if(res.command=='exit'){
    killProcess()
    console.log('Force Exit')
  }
}



function killProcess() {
  esgan.kill('SIGINT');
  console.log('killed');
  //res.send('exitnull')
}
// mediainfo('F:\\ArSrNaSystems\\video-enhance\\src\\backres\\onepiece_demo.mp4').then(result=>{
//   console.log(JSON.stringify(result));
// })

eapp.listen(port)