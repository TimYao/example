var request = require('request');
var fs = require('fs');
var path = require('path');
var soap = require('soap');
var httpRequest = require('../utility/request')();
var settings = require('../conf/appconfig').toPassport;
var config = require('../conf/appconfig').betaAdmin;

//登录验证
exports.checkLogin = function(req, res, next){
    var url = 'http://' + req.headers.host + req.url;
    if(!req.session.user && !req.cookies.UserName){
        //未登录
        res.redirect("https://passport.csdn.net/account/login?from=" + encodeURI(url));
    }else{
        if(!req.session.user){
            var userName = req.cookies.UserName;
            var userInfo = req.cookies.UserInfo;
            checkInfo(userName, userInfo, function(err, result){
                if(err){
                    res.status(5000);
                    res.render('error/500', { error: err });
                }else{
                    req.session.user = result;
                    next();
                }
            });
        }else{
            if(!req.cookies.UserName){
                req.session.user = null;
                res.redirect("https://passport.csdn.net/account/login?from=" + encodeURI(url));
            }else{
                next();
            }
        }
    }
};

//passport登录验证
function checkInfo(username, userInfo, callback){
    var url = settings.urlCheck;
    var token = settings.token;
    var params = {'UserName':username,'UserInfo':userInfo}
    httpRequest.getData(url, 'POST', params, token, function(dberr) {
        callback(dberr);
    },function(body){
        var result = JSON.parse(body);
        if(result.error || typeof(result.status) == "undefined" && !result.status){
            callback('登录验证失败!');
        }
        else{
            callback(null,result.data);
        }
    });
};

//验证beta_admin权限
exports.checkAuthority = function(req, res, next){
    if(req.url == "/env" || req.url == "/"){
        return next();
    }
    
    if(config.disable){
        return next();
    }

    var publicpath = path.resolve(__dirname, "../public");
    var files = fs.readdirSync(publicpath);
    for(var i= 0, len= files.length; i< len; i++){
        if(req.url.toLowerCase().indexOf('/' + files[i].toLowerCase() + '/') == 0){
            return next();
        }
    }

    var targetId = getTarget(req._parsedUrl.pathname);
    var username = req.session.user.userName;
    var applicationId = config.applicationId;
    var clientId = config.clientId;
    var url = config.api;

    if(!targetId){
        res.status(403);
        res.render('error/403', { error: '您没有权限访问该页面' });
    }
    else{
        var args = {clientID: clientId, applicationId: applicationId, targetId: targetId, userName: username, permissions: "view"};
        soap.createClient(url + "?wsdl", function(err, client){
            client.HavePermission(args, function(err, result) {
                if(!result.HavePermissionResult){
                    res.status(403);
                    res.render('error/403', { error: '您没有权限访问该页面' });
                }else{
                    next();
                }
            });
        });
    }
};

function getTarget(url){
    var targets = config.targets;
    var path = url.split('/')[1];
    for(var i = 0, len = targets.length; i < len; i++){
        if(path.toLowerCase() == targets[i].url.toLowerCase()){
            return targets[i].targetId;
        }
    }
    return null;
}


