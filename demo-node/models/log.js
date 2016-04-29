var logger = require('../utility/logger.js');
var time = require('../utility/time')();
var promise = require('promise');
var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);

exports.insertLog = function (req,res,next){
	var params = {};
    params['operateDate'] = time.now();
    params['operateIP'] = req.ip;
    params['requestUrl'] = req.url;
    params['requestParam'] = JSON.stringify(req.body);
    logger.info(JSON.stringify(params));
    next();
};

exports.adminLog = function(params){
    var sql = "INSERT INTO admin_log(opreator,opreate_desc,item,item_id,action,opreate_date,opreate_ip,request_url,request_params) VALUES(@opreator,@opreate_desc,@item,@item_id,@action,@opreate_date,@opreate_ip,@request_url,@request_params)";
    var params = {
        'opreator':params['opreator'],
        'opreate_desc':params['opreate_desc'],
        'item':params['item'],
        'item_id':params['item_id'],
        'action':params['action'],
        'opreate_date':time.now(),
        'opreate_ip':params['opreate_ip'],
        'request_url':params['request_url'],
        'request_params':params['request_params']
    };
    return new promise(function(resolve, reject) {
        sqlHelper.ExecuteInsert("knowledge", sql, params, function(err,lastId){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({lastId:lastId});
            }
        });
    });
}
