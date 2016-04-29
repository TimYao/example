var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var time = require("../utility/time")();
var promise = require('promise');

var db = "knowledge";

exports.contentIdWeekly = contentIdWeekly;
exports.confirmInfoByContentId = confirmInfoByContentId;

function confirmInfoByContentId(contentId){
    var sql = "select * from expert_confirm_content where content_id=@contentId and status=@status";
    var params = {contentId:contentId, status:1};
    return new promise(function (resolve, reject) {
        sqlHelper.ExecuteDataRow(db, sql, params, function (err, data) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(data);
            }
        });
    });
}


//获取一周内content
function contentIdWeekly(date,selectIds){
    var dateBefore = time.dayLastWeek(date);
    if(selectIds.length){
        var sql = "select * from expert_confirm_content where content_id not in ("+selectIds.join(',')+") and create_at>=@start and create_at<@end and status=@status and base_id in (select id from base where status=@status) order by base_id"
    }
    else{
       var sql = "select * from expert_confirm_content where create_at>=@start and create_at<@end and status=@status and base_id in (select id from base where status=@status) order by base_id"
    } 
    var params = {start: dateBefore, end: date, status: 1};
    return new promise(function (resolve, reject) {
        sqlHelper.ExecuteDataTable(db, sql, params, function (err, data) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(data);
            }
        });
    });
}

exports.getExpertConNum = function(list){
    var promises = list.map(function (data) {
        var username = data.username;
        return getNumber(username,data); // 获取专家收录内容数
    });
    return new promise.all(promises);
}

function getNumber(username,data,reload){
    reload = reload?reload:0;
    var maxAge = 60 * 60;
    return new promise(function (resolve, reject) {
        redisClient.get('expert_content_num:' + username, function (err, num) {
            if (num && reload == 0) {
                data.conCount = num;
                return resolve(data);
            }
            else {
                getMysqlCount(username).then(function (count) {
                    redisClient.set('expert_content_num:' + username, count,60*10);
                    data.conCount = count;
                    return resolve(data);
                }).catch(function(err) {
                    return reject(err);
                })
            }
        });
    });
}

function getMysqlCount(username) {
    return new promise(function (resolve, reject) {
        var sql = "select count(*) as count from expert_confirm_content where expert=@expert and status=@status";
        var params = {'expert': username,'status':1};
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
