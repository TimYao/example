module.exports = function(){
    var httprequest = {};

    httprequest.getData = function(url, method, params,token,callbackerr, callback){
        var request = require('request');
        var post_options = {
            url: url, 
            method: method, // get or post
            form: params, 
            headers: {
               'X-ACL-TOKEN': token
            }
        };
        request(post_options, function (error, response, body) {
            if (error) {
                callbackerr(error);
            }
            else{
                callback(body);
            }
        });
    }

    httprequest.getDataBody = function(url, method, params,token,callbackerr, callback){
        var request = require('request');
        var post_options = {
            url: url, 
            method: method, 
            body: params, 
            json:true, 
            headers: {
               'X-ACL-TOKEN': token
            }
        };
        request(post_options, function (error, response, body) {
            if (error) {
                callbackerr(error);
            }
            else{
                callback(body);
            }
        });
    }

    return httprequest;
}
