var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var async = require('async');
var promise = require('promise');
var node = require('./node');
var content = require('./content');
var base = require('./base');
var knowledge = require('./knowledge');

exports.sort = sort;
exports.sortBySort = sortBySort;

//数组排序
function sortBySort(arr){
  if (arr.length == 0) return [];
  var left = new Array();
  var right = new Array();
  var pivot = arr[0];
  for (var i = 1; i < arr.length; i++) {
    arr[i].sort < pivot.sort ? right.push(arr[i]): left.push(arr[i]);
  }
  return sortBySort(right).concat(pivot, sortBySort(left));
}

function sort(list){
    return new promise(function(resolve, reject) {
        var topicId = list.id;
        var contents = node.getIdPath(list);

        var promises = contents.map(function(d){
            if(d && d.sort){
                return contentSort(d, topicId);
            }
        });

        promise.all(promises).then(function(result){
            return resolve(true);
        }).catch(function(err){
            return reject(err);
        });
    });
}

function contentSort(info, topicId){
    return new promise(function(resolve, reject) {
        var sql = "update topic_content set sort=@sort, opreator=@opreator where topic_id=@topicId and content_id=@contentId";
        var params = {
            sort: info.sort,
            opreator: info.opreator,
            topicId: topicId,
            contentId: info.id
        }
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
            if(err){
                return reject(err);
            }
            else{
                return resolve(count);
            }
        });
    });
}

//获取全部专题
exports.getAllBase = function(callback){
    base.getAll(callback);
}
//获取每个专题最新的子专题
exports.getNewTopic = function(callback){
    var sql = " select base_id,max(name) as name from topic group by base_id ";
    sqlHelper.ExecuteDataTable('knowledge',sql,{},function(err,data){
        var new_topic = {};
        if(err){
            console.log(" slelect new topic err ")
        }else{
            for(i in data){
                new_topic[data[i].base_id] = data[i].name;
            }
        }
        callback(err,new_topic);
    });
}

//获取专题中子专题个数
exports.getTopicCount = function(callback){
    //var sql = " select base_id,count(name) as count from (select base_id,name from topic group by base_id,name) as t group by t.base_id "
    var sql = "select base_id,count(name) as count from topic group by base_id "
    var params = { };
    sqlHelper.ExecuteDataTable('knowledge',sql,params,function(err,data){
        var topic_count = {};
        if(data){
            for(i in data) {
                topic_count[data[i].base_id] = data[i].count;
            }
        }
        callback(err,topic_count);
    });
}

//创建子专题
exports.insertTopic = function(base_id,name,callback){
    var sql = " insert into topic(base_id,name,status,create_at,update_at) values(@base_id,@name,@status,now(),now()) ";
    var params = {status:0,base_id:base_id,name:name}
    sqlHelper.ExecuteInsert("knowledge", sql, params,callback);
}
//根据专题 列出子专题列表
exports.subTopicList = function(page,pagesize,base_id,callback){
    var sql = 'select t.*,b.name as base_name from topic as t join base as b on t.base_id = b.id where t.base_id=@base_id order by t.name desc,status desc';
    var params = {base_id:base_id};
    sqlHelper.ExecuteDataByPage('knowledge',sql,params,page,pagesize,callback);
}
//获取子专题收录内容个数统计，批量获取  topic_ids
exports.subTopicContentCount = function(topic_ids,callback){
    var sql = "select topic_id,count(topic_id) as count from topic_content where topic_id in (" + topic_ids.join(',') + ") group by topic_id";
    var params = {};
    sqlHelper.ExecuteDataTable('knowledge',sql,params,function(err,data){
        var topic_count = {};
        if(data){
            for(var i in data){
                topic_count[data[i].topic_id] = data[i].count;
            }
        }
        callback(err,topic_count);
    });
}

//获取子专题中内容
exports.getContentById = function(topic_id,callback){
    var sql = "select * from topic_content where topic_id=@topic_id order by sort asc";
    var params = {topic_id:topic_id};
    sqlHelper.ExecuteDataTable('knowledge',sql,params,callback);
}

//获取子专题名称
exports.getNameById = function(topic_id,callback){
    var sql = "select * from topic where id=@topic_id ";
    var params = {topic_id:topic_id};
    sqlHelper.ExecuteDataRow('knowledge',sql,params,callback);
}
//获取知识库名称
exports.getBaseNameById = function(base_id,callback){
    var sql = "select * from base where id=@base_id ";
    var params = {base_id:base_id};
    sqlHelper.ExecuteDataRow('knowledge',sql,params,callback);
}
//添加内容到子专题
exports.addContentToTopic = function(topic_id,base_id,user_name,content_ids,callback){
    var sql = "insert into topic_content(topic_id,base_id,knowledge_id,content_id,opreator,status,create_at,update_at) values ";
    var content_ids_arr = content_ids.split(',');
    for(var i in content_ids_arr){
        var arr = content_ids_arr[i].split('-');
        var knowledgeId = arr[0];
        var contentId = arr[1];
        sql += "(" + topic_id + ',' + base_id + ',' + knowledgeId + ',' + contentId + ','
            + "'" + user_name + "'" + ',1,now(),now()' + "),";
    }
    sql = sql.substring(0,sql.length - 1);
    sqlHelper.ExecuteInsert('knowledge',sql,{},callback);
}
exports.removeContent = function(content_id,topic_id,callback){
    var sql = 'delete from topic_content where topic_id=@topic_id and content_id=@content_id';
    var params = {content_id:content_id,topic_id:topic_id};
    sqlHelper.ExecuteInsert('knowledge',sql,params,callback);
}

exports.publish = function(topic_id,callback){
    var sql = 'update topic set status=1 where id=@topic_id';
    var params = {topic_id:topic_id};
    sqlHelper.ExecuteInsert('knowledge',sql,params,callback);
}

exports.findByNameAndStatus = function(base_id,name,callback){
    var sql = "select * from topic where base_id=@base_id and name=@name and status=1 ";
    var params = {base_id:base_id,name:name};
    sqlHelper.ExecuteDataRow('knowledge',sql,params,callback);
}

exports.findByName = function(base_id,name,callback){
    var sql = "select * from topic where base_id=@base_id and name=@name";
    var params = {base_id:base_id,name:name};
    sqlHelper.ExecuteDataRow('knowledge',sql,params,callback);
}
