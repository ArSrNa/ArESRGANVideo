var electronInstaller = require('electron-winstaller');
var path = require("path");
 
resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: path.join('./'), //入口，electron-package生成的文件目录
  outputDirectory: path.join('./out'),     //出口，electron-winstaller生成的文件目录
  authors: 'ArSrNa',
  exe: "ESRGANVideo.exe",        //名称
  setupIcon: "./icon.ico",//安装图标，必须本地
  // iconUrl: 'http://pm72qibzx.bkt.clouddn.com/icon.ico',//程序图标，必须url
  noMsi: true,
  setupExe:'ESRGANVideo.exe',
  title:'ArUI ESRGAN视频版',
  description: "ArSrNaUI ESRGAN视频无损超分辨率"
});
 
resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));