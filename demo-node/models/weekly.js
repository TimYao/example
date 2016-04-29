var time = require('../utility/time')();
var promise = require('promise');
var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var confirmModel = require('./expertConfirm');
var contentModel = require('./content');
var baseModel = require('./base');
var httpRequest = require('../utility/request')();

exports.certainWeekly = certainWeekly;
exports.contentShow = contentShow;
exports.removeContent = removeContent;
exports.addContentToWeekly = addContentToWeekly;
exports.listShow = listShow;
exports.publish = publish;
exports.promotionShow = promotionShow;
exports.setPromotion = setPromotion;

//推广页面--判断是否编辑
function promotionShow(username) {
    return new promise(function(resolve, reject) {
        var json = {};
        confirmWeekly(username).then(function(info) {
            json.weekly = info;
            var weeklyId = info.id;
            return getWeeklyPromotionInfo(weeklyId);
        }).then(function(result) {
            json.promotion = result;
            return resolve(json);
        })
    }).catch(function(err) {
        return reject(err);
    })
}

//设置推广
function setPromotion(info,username) {
    var title = info.title;
    var url = info.url;
    var description = info.description;
    var weeklyId = info.weeklyId;
    return new promise(function(resolve, reject) {
        getWeeklyPromotionInfo(weeklyId).then(function (result) {
            if (result && result.url != '') {
                return updatePromotionToWeekly(weeklyId, title, url, username, description);
            }
            else {
                return insertPromotionToWeekly(weeklyId, title, url, username, description);
            }
        }).then(function (status) {
            return resolve(status);
        }).catch(function (err) {
            return reject(err);
        });
    });
}

//获取周报推广
function getWeeklyPromotionInfo(weeklyId) {
    return new promise(function(resolve, reject) {
        var sql = "select * from weekly_promotion where weekly_id=@weekly_id";
        var params = {'weekly_id':weeklyId};
        sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    })
}

//添加推广到周报
function insertPromotionToWeekly(weeklyId,title,url,username,description){
    return new promise(function(resolve, reject) {
        var sql = "insert into weekly_promotion(weekly_id,title,url,description,operator,create_at,update_at) values (@weekly_id,@title,@url,@description,@operator,@create_at,@update_at)"
        var params = {'weekly_id':weeklyId,'title':title,'url':url,'operator':username,'description':description,'create_at':new Date(),'update_at':new Date()};
        sqlHelper.ExecuteInsert('knowledge',sql,params,function(err,result){
            if(err){
                return reject(err);
            }
            else{
                return resolve(true);
            }
        });
    });
}

//更新周报推广
function updatePromotionToWeekly(weeklyId,title,url,username,description){
    return new promise(function(resolve, reject) {
        var sql = "update weekly_promotion set title=@title,description=@description,url=@url,operator=@operator,update_at=@update_at where weekly_id=@weekly_id";
        var params = {'title':title,'url':url,'operator':username,'update_at':new Date(),'weekly_id':weeklyId,'description':description};
        sqlHelper.ExecuteInsert('knowledge',sql,params,function(err,result){
            if(err){
                return reject(err);
            }
            else{
                return resolve(true);
            }
        });
    });
}

function publish(weeklyId,username) {
    return new promise(function(resolve, reject) {
        updateWeekly(weeklyId,username).then(function(status){
            // 发送微信和邮件周报
            var type = 'wechat';
            var m1 = weeklySend(weeklyId,type);
            type = 'edm';
            var m2 = weeklySend(weeklyId,type);
            return promise.all([m1,m2]);
        }).then(function(result){
            return resolve(true);
        }).catch(function(err){
            console.log(err);
            return reject(err);
        });
    });
}

function weeklySend(weeklyId,type) {
    return new promise(function(resolve, reject) {
        var settings = require('../conf/appconfig').toLib;
        var url = settings.lib+'/api/weekly/mail/'+weeklyId;
        if(type == 'wechat'){
            url = settings.lib+'/api/weekly/wechat/'+weeklyId;
        }
        var token = settings.token;
        var params = {};
        httpRequest.getData(url, 'GET', params, token, function(dberr) {
            return reject(dberr);
        },function(body){
            return resolve(true);
        });
    });
}

//获取本周第一天时间
function weeklyName(date) {
    var m = new Date(date);
    return time.firstDayForWeek(m);
}

//最新推荐
function certainWeekly(username) {
    var json = {};
    return new promise(function(resolve, reject) {
        confirmWeekly(username).then(function(info){
            json.weekly = info;
            var weeklyId = info.id;
            // 获取weeklyId中内容
            return getWeeklyContent(weeklyId);
        }).then(function(weeklyInfo){
            var contentIds = new Array();
            if(weeklyInfo.length){
                for(var k in weeklyInfo){
                    contentIds.push(weeklyInfo[k].content_id);
                }
                return contentModel.contentInfoByIds(contentIds);
            }
            else{
                return weeklyInfo;
            }
        }).then(function(content){
            json.content = content;
            return promotionShow(json.weekly.id);
        }).then(function(result) {
            json.promotion = result.promotion;
            return resolve(json);
        }).catch(function(err){
            console.log(err);
            return reject(err);
        });
    });
}

function confirmWeekly(username){
    return new promise(function(resolve, reject) {
        var time = new Date();
        var date = weeklyName(time);
        getInfoByName(date).then(function(week){
            if(!week){
                return weeklyInfo(date, username);
            }
            else{
                return week;
            }
        }).then(function(week){
            return resolve(week);
        }).catch(function(err){
            console.log("==========="+err);
            return reject(err);
        });
    });
}

function weeklyInfo(date, username) {
    return new promise(function(resolve, reject) {
        insertWeekly(date,username).then(function(result){
            var weeklyId = result;
            return getInfoById(weeklyId);
        }).then(function(week){
            return resolve(week);
        }).catch(function(err){
            return reject(err);
        });
    });
}

//获取本周周报
function getInfoByName(name){
    return new promise(function(resolve, reject) {
        var sql = "select * from weekly where name=@name";
        var params = {name:name};
        sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    });
}

function getInfoById(weeklyId){
    return new promise(function(resolve, reject) {
        var sql = "select * from weekly where id=@id";
        var params = {id:weeklyId};
        sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    });
}

//插入本周周报
function insertWeekly(name,username){
    var status = 0;
    var create_at = new Date();
    return new promise(function(resolve, reject) {
        var sql = "insert into weekly (name,status,create_at,operator) values (@name,@status,@create_at,@operator)";
        var params = {
            'name':name,
            'status':status,
            'create_at':create_at,
            'operator':username
        };
        sqlHelper.ExecuteInsert("knowledge", sql, params, function(err, lastid){
            if(err){
                return reject(err);
            }
            else{
                return resolve(lastid);
            }
        });
    });
}

//更新本周周报
function updateWeekly(weeklyId,username){
    return new promise(function(resolve, reject) {
        var sql = "update weekly set status=@status,update_at=@update_at,operator=@operator where id=@id";
        var params = {
            'id':weeklyId,
            'status':1,
            'update_at': new Date(),
            'operator':username
        };
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, affectNum){
            if(err){
                return reject(err);
            }
            else{
                return resolve(affectNum);
            }
        });
    })
}

//针对是否已生成本期周报分别操作
function getWeeklyInfo(req){
    return new promise(function(resolve, reject) {
        var now = new Date();
        var name = weeklyName(now);
        getInfoByName(name).then(function(result){
            //本周周报已生成
            if(result && result != ''){
                return resolve(result);
            }
            else{
                return initWeekly(name);
            }
        }).then(function(weekly){
            return resolve(weekly);
        }).catch(function(err){
            return reject(err);
        });
    });
}

//初始化周报
function initWeekly(name){
    return new promise(function(resolve,reject) {
        var operator = req.cookies.UserName;
        return insertWeekly(name,operator);
    }).then(function(result) {
        return getInfoByName(name);
    }).catch(function(err){
        return reject(err);
    });
}

function contentShow(date,baseId,page,pageSize){
    var count = 0;
    var baseIds;
    var json = {};
    return new promise(function(resolve, reject) {
        // 根据日期获取weeklyId
        var firstDay = weeklyName(date);
        getInfoByName(firstDay).then(function(weeklyInfo){
            if(!weeklyInfo){
                throw new Error("不存在该周报");
            }
            json.weekly = weeklyInfo;
            var weeklyId = weeklyInfo.id
            return getWeeklyContent(weeklyId);
        }).then(function(weeklyContent){
            var selectIds = new Array();
            for(var k in weeklyContent){
                selectIds.push(weeklyContent[k].content_id);
            }
            return confirmModel.contentIdWeekly(date,selectIds);
        }).then(function(confirmInfo){
            var num = 10;
            return contentModel.contentWeekly(baseId,confirmInfo,num,page,pageSize);
        }).then(function(result){
            // 根据contentIds获取收录内容
            var contentIds = result.ids;
            json.count = result.count;
            baseIds = result.baseIds;
            return contentModel.contentInfoByIds(contentIds);
        }).then(function(content){
            json.content = content;
            return baseModel.getListByIds(baseIds);
        }).then(function(baseInfo){
            json.base = baseInfo;
            return resolve(json);
        }).catch(function(err){
            console.log(err);
            return reject(err);
        });
    });
}

//获取本周周报内容列表
function getWeeklyContent(weeklyId){
    return new promise(function(resolve, reject) {
        var sql = "select * from weekly_content where weekly_id=@weeklyId";
        var params = {'weeklyId':weeklyId};
        sqlHelper.ExecuteDataTable("knowledge", sql, params, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    })
}

//移除操作
function removeContent(content_id,weekly_id) {
    return new promise(function (resolve, reject) {
        var sql = 'delete from weekly_content where weekly_id=@weekly_id and content_id=@content_id';
        var params = {content_id: content_id, weekly_id: weekly_id};
        sqlHelper.ExecuteInsert('knowledge', sql, params, function (err, data) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(data);
            }
        });
    })
}

//添加内容到周报
function addContentToWeekly(weeklyId,contentIds,username){
    return new promise(function(resolve, reject) {
        var sql = "insert into weekly_content(weekly_id,content_id,opreator,create_at) values ";
        var contentIdsArr = contentIds.split(',');
        for(var i in contentIdsArr){
            var contentId = contentIdsArr[i];
            sql += "(" + weeklyId + ',' + contentId + ',' + "'" + username + "'" + ',now()' + "),";
        }
        sql = sql.substring(0,sql.length - 1);
        sqlHelper.ExecuteInsert('knowledge',sql,{},function(err,result){
            if(err){
                return reject(err);
            }
            else{
                return resolve(true);
            }
        });
    });
}

//获取已发布的周报
function getPublishedWeekly(){
    return new promise(function(resolve, reject) {
        var sql = "select * from weekly where status='1' order by id desc" ;
        sqlHelper.ExecuteDataTable("knowledge", sql, {}, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    })
}

//根据weekly_id分组
function getContentIds() {
    return new promise(function (resolve, reject) {
        getPublishedWeekly().then(function(list){
            var weeklyids = [];
            for(var i in list){
                weeklyids[i] = list[i].id;
            }
            var promises = weeklyids.map(function(id){
                if(id){
                    return getWeeklyContent(id);
                }
            });
            promise.all(promises).then(function(result){
                return resolve(result);
            });
        }).catch(function (err) {
            return reject(err);
        });
    })
}

function getRecord(){
    return new promise(function (resolve, reject) {
        getContentIds().then(function(result) {
            var contentIds = [];
            for (var i in result) {
                contentIds[i] = result[i];
                for (var j in result[i]) {
                    contentIds[i][j] = result[i][j].content_id;
                }
            }
            var promises = contentIds.map(function (ids) {
                if (ids) {
                    return contentModel.contentInfoByIds(ids);
                }
            });
            promise.all(promises).then(function (result) {
                return resolve(result);
            });
        }).catch(function(err) {
            return reject(err);
        })
    })
}

//周报记录
function listShow() {
    var json = {};
    return new promise(function (resolve, reject) {
        getPublishedWeekly().then(function (list) {
            json.weekly = list;
        }).then(function () {
            return getRecord();
        }).then(function (content) {
            json.content = content;
            return getWeeklyPromotionInfo(json.weekly[0].id);
        }).then(function(promotion){
            json.promotion = promotion;
            return resolve(json);
        }).catch(function (err) {
            return reject(err);
        });
    })
}
