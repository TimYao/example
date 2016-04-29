var request = require('request');
var httpRequest = require('../utility/request')();
var settings = require('../conf/appconfig').toUc;
var promise = require('promise');

//获取用户信息
exports.getUserInfo = function(username){
    return new promise(function(resolve, reject) {
        var url = settings.userInfo;
        var token = settings.token;
        var params = {'username':username}
        httpRequest.getData(url, 'POST', params, token, function(dberr) {
            return reject(dberr);
        },function(body){
            var result = JSON.parse(body);
            return resolve(result);
        });
    })
};
