var fs = require("fs");
var path = require("path");
var promise = require('promise');

var qiniu = require("qiniu");
var config = require("../conf/appconfig").qiniu;

// 上传到服务器
exports.saveImg = function(file, directory){
  var baseInfo;
  return new promise(function(resolve, reject) {
    saveImage(file).then(function(imgPath){
      return upload(imgPath, directory); // 上传到qiniu
    }).catch(function(err){
      return reject(err);
    }).then(function(url){
      return resolve(url);
    }).catch(function(err){
      return reject(err);
    });
  });
}

function saveImage(files){
  return new promise(function(resolve, reject) {
    if(files.size == 0){
      // 删除临时文件
      fs.unlink(files.path);
      return resolve('');
    }
    else {
      //解决fs.rename 不能垮磁盘问题
      var uploadDir = process.platform.match(/win/ig) ? 'C:\\tmp\\' :  '/tmp/'; // 临时文件
      var extName = '';  //后缀名
      switch (files.type){
        case "image/jpeg":
          extName = ".jpg";
          break;
        case "image/png":
          extName = ".png";
          break;
        default :
          extName = ".png";
          break;
      }

      var imgName = (new Date()).getTime() + extName;
      var newPath = uploadDir + imgName;
      fs.renameSync(files.path, newPath);  //重命名
      return resolve(newPath);
    }
  });
}

// 长传到qiniu
function upload (imgPath, directory){
  return new promise(function(resolve, reject) {
    if(imgPath){
      qiniu.conf.ACCESS_KEY = config.access_key;
      qiniu.conf.SECRET_KEY = config.secret_key;
      var token = new qiniu.rs.PutPolicy(config.scope).token();
      var time = new Date();
      var fileName = "upload/" + directory + '/' + time.getTime() + "_" + time.getMilliseconds() + path.extname(imgPath).toLowerCase();
      var extra = new qiniu.io.PutExtra();
      var url = config.domain + fileName;
      new qiniu.io.putFile(token, fileName, imgPath, extra, function (err, ret) {
        fs.unlink(imgPath);
        if (!err) {
          // 上传成功
          return resolve(url);
        } else {
          // 上传失败
          return reject(err);

        }
      });
    }
    else {
      // do nothing
      return resolve('');
    }
  });
}
    