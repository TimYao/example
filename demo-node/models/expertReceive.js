var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var time = require("../utility/time")();
var promise = require('promise');
var db = "knowledge";

exports.insertContent = insertContent;

//专家未完成收录内容处理的个数
exports.getUnCompleteCount = function(username){
    return new promise(function (resolve, reject) {
        var sql = "select count(*) as count from expert_receive_content where expert=@expert";
        var params = {'expert': username};
        sqlHelper.ExecuteDataSet(db, sql, params, function (err, count) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(count[0].count);
            }
        });
    });
}
//某些知识点下，专家未完成收录内容处理的个数
exports.getUnCompleteCountByKid = function(username,kids){
    return new promise(function (resolve, reject) {
        var sql = "select count(*) as count,knowledge_id from expert_receive_content where expert=@expert and status=@status and knowledge_id in("+kids.join(',')+") group by knowledge_id";
        var params = {'expert': username,'status':0};
        sqlHelper.ExecuteDataSet(db, sql, params, function (err, rows) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(rows);
            }
        });
    });
}

function insertContent(data){
    return new promise(function(resolve, reject){
        var time = new Date();
        var sql = "insert into expert_receive_content(expert,knowledge_id,type,title,url,owner,source_id,create_at,orig_create_at,status) values (@expert,@knowledgeId,@type,@title,@url,@owner,@sourceId,now(),@createTime,status)";
        var params = {
            'expert': data.expert,
            'knowledgeId': data.knowledgeId, 
            'type':data.type,
            'title':data.title,
            'url':data.url,
            'owner':data.owner,
            'sourceId':data.sourceId,
            'createTime': data.createDate,
            'status': 0
        };
        sqlHelper.ExecuteInsert(db, sql, params, function(err,lastId){
            if(err){
                return reject(err);
            }
            else{
                console.log(lastId);
                return resolve(lastId);
            }
        });
    });
}