var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var time = require("../utility/time")();
var promise = require('promise');
var nodeModel = require("./node");


var db = "knowledge";

exports.getListByExpertUsernames=getListByExpertUsernames;
exports.getKownledgeByUser = getKownledgeByUser;
exports.doInsert=doInsert;
exports.doInsertMul=doInsertMul;
exports.doDel = doDel;
exports.exist = exist;
exports.expertByKnowledgeId = expertByKnowledgeId;

//批量获取专家的知识点
function getListByExpertUsernames(expert_usernames_str){
    var sql="select knowledge_id,expert from expert_knowledge where expert in("+expert_usernames_str+")";
    var params={};
    return new promise(function(resolve,reject){
        sqlHelper.ExecuteDataTable(db, sql, params,function(err,knowledges){
            if(err){
                return reject(err);
            }
            else {
                return resolve({knowledges: knowledges});
            }
        });
    })
}
//获取单个专家的知识点
function getKownledgeByUser(username){
    var sql="select * from expert_knowledge where expert=@expert order by id desc";
    var params={'expert':username};
    return new promise(function(resolve,reject){
        sqlHelper.ExecuteDataTable(db, sql, params,function(err,knowledges){
            if(err){
                return reject(err);
            }
            else {
                return resolve({knowledges: knowledges});
            }
        });
    })
}
//更改专家负责的知识点
//exports.doUpdate = function(toDel,toAdd,baseId,expert,opreator){
//    return new promise(function(resolve,reject){
//        var toDelStr = toDel.join(',');
//        var toAddStr = toAdd.join(',');
//
//
//        if(toDelStr != ''){
//            var sqlDel="update expert_knowledge " +
//                "set " +
//                    "status=-1,opreator="+opreator+",update_at="+time.now()+
//                " where " +
//                    "expert='"+expert+"' and knowledge_id in("+toDelStr+") and base_id = "+baseId;
//            var paramsDel={};
//            sqlHelper.ExecuteNoQuery(db, sqlDel, paramsDel,function(err,num){
//            });
//        }
//        if(toAddStr != ''){
//            doInsertMul(toAdd,baseId,expert);
//        }
//        return resolve(true);
//    })
//
//}

function doInsertMul(toAdd,baseId,expert){
    toAdd = toAdd||[];
    var promises = toAdd.map(function (klId) {
        return doInsert(klId,baseId,expert)
    });
    return promise.all(promises);
}

function doInsert(klId,baseId,expert){
    return new promise(function(resolve,reject){
        if(klId == '' || klId == null || klId == undefined){return resolve(0);}
        var sql="insert into expert_knowledge" +
            "(knowledge_id,base_id,expert,create_at)" +
            " values" +
            "(@knowledge_id,@base_id,@expert,@create_at)";
        var params={
            'knowledge_id':parseInt(klId),
            'base_id':baseId,
            'expert':expert,
            'create_at':time.now(),
        };
        sqlHelper.ExecuteInsert(db, sql, params,function(err,insertId){
            if(err){
                return reject(err);
            }
            else {
                return resolve(insertId);
            }
        });
    })

}

function doDel(expert,baseId){
    return new promise(function(resolve,reject){
        var sql="delete from expert_knowledge " +
            "where expert=@expert and base_id=@base_id";
        var params={
            'base_id':baseId,
            'expert':expert,

        };
        sqlHelper.ExecuteNoQuery(db, sql, params,function(err,num){
            if(err){
                return reject(err);
            }
            else {
                return resolve(num);
            }
        });
    })
}

function exist(knowledgeId){
    // 判断知识点是否分配给专家
    return new promise(function(resolve,reject){
        var sql = "select count(*) as count from expert_knowledge where knowledge_id=@knowledgeId ";
        var params = {'knowledgeId': knowledgeId};
        sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, info){
            if(err){
                return reject(err);
            }
            else{
                return resolve(info.count);
            }
        });
    });
}

function expertByKnowledgeId(baseId, knowledgeId){
    return new promise(function(resolve,reject){
        var sql = "select distinct expert from expert_knowledge where base_id=@baseId and knowledge_id=@knowledgeId";
        var params = {baseId: baseId, knowledgeId: knowledgeId};
        sqlHelper.ExecuteDataTable("knowledge", sql, params, function(err, data){
            if(err){
                return reject(err);
            }
            else{
                return resolve(data);
            }
        });
    });
}






