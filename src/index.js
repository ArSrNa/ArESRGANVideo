/* 2022-7-8
   Powered by Ar-Sr-Na
              ArSrNaRenderInfinity
   该部分为后端js，负责接收前端传送指令给所有依赖
   以及子程序
   相当于处理器
   开发日期：2022-4-6
   希儿老婆天下第一！！！
*/
const { app, BrowserWindow } = require("electron"),
  path = require("path"),
  eapp = require("express")(),
  expressWs = require("express-ws"),
  mediainfo = require("node-mediainfo"),
  // elecreload = require('electron-reload'),
  // COS = require('cos-nodejs-sdk-v5'),
  // request = require('request'),
  child_process = require("child_process");
(spawn = child_process.spawn), (exec = child_process.exec);
fs = require("fs");

/*此处在debug有效，请勿生产时使用！
ffmpegPath = path.join(__dirname,'../backres/ffmpeg.exe');
esrganPath = path.join(__dirname,'../backres/realesrgan-ncnn-vulkan.exe');
*/
/*此处在production有效，请勿在开发时使用！*/
ffmpegPath = path.join(
  process.cwd(),
  "/resources/extraResources",
  "ffmpeg.exe"
);
esrganPath = path.join(
  process.cwd(),
  "/resources/extraResources",
  "realesrgan-ncnn-vulkan.exe"
);

port = 3003;

expressWs(eapp);

// elecreload(__dirname);
//  elecreload( path.resolve('.') , {
//    electron: require(`${ path.resolve('.') }/node_modules/electron`)
//  });

// var bucket='app-release',
// 	APPID=1257609559,
// 	region='ap-guangzhou';

// var cos = new COS({
//     getAuthorization: function (options,callback) {
//         // 异步获取临时密钥
//         request({
//             url: 'https://api.arsrna.cn/release/coskey',
//             qs: {
// 				bucket:bucket,
// 				APPID:APPID,
// 				region:region
//             }
//         }, function (err, response, body) {
// 			console.log(body)
//             try {
//                 var data = JSON.parse(body);
//                 var credentials = data.credentials;
//             } catch(e) {}
//             if (!data || !credentials) return console.error('credentials invalid');
//             callback({
//                 TmpSecretId: credentials.tmpSecretId,        // 临时密钥的 tmpSecretId
//                 TmpSecretKey: credentials.tmpSecretKey,      // 临时密钥的 tmpSecretKey
//                 SecurityToken: credentials.sessionToken, // 临时密钥的 sessionToken
//                 ExpiredTime: data.expiredTime,               // 临时密钥失效时间戳，是申请临时密钥时，时间戳加 durationSeconds
//             });
//         });
//     }
// });

function downCos(key, path) {
  cos.getObject(
    {
      Bucket: `${bucket}-${APPID}`,
      /* 填入您自己的存储桶，必须字段 */
      Region: region,
      /* 存储桶所在地域，例如ap-beijing，必须字段 */
      Key: key,
      /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
      Output: path,
    },
    function (err, data) {
      console.log(err || data);
    }
  );
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
eapp.get("/getMedia", function (req, res) {
  var path = req.query.filePath;
  mediaInfo(path, res);
});

async function mediaInfo(adr, res) {
  const result = await mediainfo(adr);
  console.log(JSON.stringify(result));
  res.send(JSON.stringify(result));
}

eapp.ws("/toFrame", function (ws, req) {
  ws.on("message", function (data) {
    var res = JSON.parse(data);
    console.log(data);
    toFrame(ws, res, [
      "-i",
      res.path,
      "-qscale:v",
      1,
      "-qmin",
      1,
      "-vsync",
      0,
      `${res.path}_tmp_frames/%0d.jpg`,
      "-loglevel",
      "info",
    ]);
  });
});

eapp.ws("/optimization", function (ws, req) {
  ws.on("message", (data) => {
    var res = JSON.parse(data);
    console.log(data);
    optimization(ws, res, [
      "-i",
      `${res.path}_tmp_frames`,
      "-o",
      `${res.path}_out_frames`,
      "-n",
      res.model,
      "-s",
      res.scale,
      "-f",
      "jpg",
    ]);
  });
});

eapp.ws("/toVideo", function (ws, req) {
  ws.on("message", (data) => {
    var res = JSON.parse(data);
    console.log(data);
    toVideo(ws, res, [
      "-r",
      res.frameRate,
      "-i",
      `${res.path}_out_frames\\%0d.jpg`,
      "-i",
      res.path,
      "-c:a",
      "copy",
      "-vcodec",
      res.codec, //libx264
      `${res.path}_enhanced.mp4`,
      "-y",
    ]);
  });
});

function toFrame(ws, res, args) {
  if (res.command) {
    fs.mkdir(`${res.path}_tmp_frames/`, function (err) {
      if (err) ws.send(JSON.stringify(err));
      ws.send("创建目录成功_tmp");
    });
    console.log("执行命令toFrame");
    try {
      ffmpeg = spawn(ffmpegPath, args);
    } catch (err) {
      res.send(
        JSON.parse({
          type: "error",
          msg: err,
        })
      );
    }
    ffmpeg.stdout.on("data", function (data) {
      console.log(data.toString("utf8"));
      ws.send(
        JSON.stringify({
          type: "stdout",
          data: data.toString("utf8"),
        })
      );
    });

    ffmpeg.stderr.on("data", function (data) {
      console.log(data.toString("utf8"));
      ws.send(
        JSON.stringify({
          type: "stderr",
          data: data.toString("utf8"),
        })
      );
    });

    ffmpeg.on("exit", function (code, signal) {
      ws.send(
        JSON.stringify({
          type: "exit",
          data: "exit" + code,
          exit: true,
        })
      );
      console.log("child process eixt ,exit:" + code);
      return code;
    });
  } else if (res.command == "exit") {
    ffmpeg.kill("SIGINT");
    console.log("Force Exit");
  }
}

function optimization(ws, res, args) {
  if (res.command == true) {
    try {
      esgan = spawn(esrganPath, args);
    } catch (err) {
      res.send(err);
    }
    fs.mkdir(`${res.path}_out_frames/`, function (err) {
      if (err) console.error(err);
      console.log("创建目录成功_out");
      console.log("执行命令增强");
    });

    esgan.stdout.on("data", function (data) {
      //console.log(data.toString('utf8'))
      ws.send(
        JSON.stringify({
          type: "stdout",
          data: data.toString("utf8"),
        })
      );
    });

    esgan.stderr.on("data", function (data) {
      //console.log(data.toString('utf8'))
      ws.send(
        JSON.stringify({
          type: "stderr",
          data: data.toString("utf8"),
        })
      );
    });

    esgan.on("exit", function (code, signal) {
      console.log("child process eixt ,exit:" + code);
      ws.send(
        JSON.stringify({
          type: "exit",
          data: "exit" + code,
          exit: true,
        })
      );
      return code;
    });
  } else if (res.command == "exit") {
    esgan.kill("SIGINT");
    console.log("Force Exit");
  }
}

function toVideo(ws, res, args) {
  if (res.command == true) {
    try {
      tovid = spawn(ffmpegPath, args);
    } catch (err) {
      res.send(err);
    }
    console.log("执行命令合成视频");

    tovid.stdout.on("data", function (data) {
      //console.log(data.toString('utf8'))
      ws.send(
        JSON.stringify({
          type: "stdout",
          data: data.toString("utf8"),
        })
      );
    });

    tovid.stderr.on("data", function (data) {
      console.log(data.toString("utf8"));
      ws.send(
        JSON.stringify({
          type: "stderr",
          data: data.toString("utf8"),
        })
      );
    });

    tovid.on("exit", function (code, signal) {
      console.log("child process eixt ,exit:" + code);
      ws.send(
        JSON.stringify({
          type: "exit",
          data: "exit" + code,
          exit: true,
        })
      );
      return code;
    });
  } else if (res.command == "exit") {
    tovid.kill("SIGINT");
    console.log("Force Exit");
  }
}

eapp.ws("/delete", (ws, req) => {
  ws.on("message", (data) => {
    var res = JSON.parse(data);
    if (res.delete == true) {
      deleteDir(res.content, ws);
    }
  });
});

function deleteDir(url, ws) {
  console.log("delete: " + url);
  var files = [];
  if (fs.existsSync(url)) {
    //判断给定的路径是否存在
    files = fs.readdirSync(url); //返回文件和子目录的数组
    files.forEach(function (file, index) {
      var curPath = path.join(url, file);
      if (fs.statSync(curPath).isDirectory()) {
        //同步读取文件夹文件，如果是文件夹，则函数回调
        deleteDir(curPath);
      } else {
        fs.unlinkSync(curPath); //是指定文件，则删除
        ws.send("删除成功");
      }
    });
    fs.rmdirSync(url); //清除文件夹
  } else {
    console.log("给定的路径不存在!");
    ws.send("给定的路径不存在");
  }
}

eapp.get("/saveProfile", function (req, res) {
  console.log(req.query);
  fs.writeFile(
    path.join(__dirname, `./profile/profile${req.query.type}.json`),
    JSON.stringify(req.query.data),
    (err) => {
      if (err) {
        res.send(req.query.type + "配置文件保存错误 " + err);
      }
      res.send(`成功保存${req.query.type}配置`);
    }
  );
});

eapp.get("/hotUpdate", function (req, res) {
  return false;
  downCos("app.asar", path.join(__dirname).replace("app\\src", ""));
});

eapp.get("/openURL", (req, res) => {
  switch (process.platform) {
    case "darwin":
      exec(`open ${req.query.url}`);
      break;
    case "win32":
      exec(`start ${req.query.url}`);
      break;
    default:
      exec("xdg-open", [url]);
  }
  res.send("success");
});

eapp.listen(port);
