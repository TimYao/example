var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var async = require('async');
var promise = require('promise');
var content = require('./content');
var base = require('./base');
var knowledge = require('./knowledge');
var setting = require("../conf/appconfig");
var request = require('request');
//获取知识列表
exports.getListByPage = function (page, pagesize,params, callback) {
    var query_params = {'status': 1};
    var base_id = params.base_id;
    var create_at = params.create_at;
    var content_type = params.content_type;
    var knowledgeId = params.knowledge;
    var sql = "select * from expert_confirm_content where status=@status";
    if(params.content_ids && params.content_ids.length > 0){
        sql += " and content_id not in ( " + params.content_ids.join(',') +") ";
    }
    if(base_id && base_id != 'all'){
        sql += " and base_id=@base_id ";
        query_params['base_id'] = base_id;
    }
    if(knowledgeId && knowledgeId !=0){
        sql += " and knowledge_id=@knowledgeId ";
        query_params['knowledgeId'] = knowledgeId;
    }
    if(create_at && create_at != ''){
        sql += " and create_at  >= @create_at and create_at <= @end_at ";
        query_params['create_at'] = create_at;
        query_params['end_at'] = create_at + ' 23:59:59'
    }
    if(content_type && content_type != 'all'){
        sql += " and content_type=@content_type ";
        query_params['content_type'] = parseInt(content_type);
    }
    sql += " order by create_at desc ";
    sqlHelper.ExecuteDataByPage("knowledge", sql, query_params, page, pagesize, callback);
};


exports.contentTypeProcess = function(type){
    //1文章 2视频 3文档 4问答 5代码
    var typeStr;
    switch (type) {
        case 1: typeStr = "文章";
            break;
        case 2: typeStr = '视频';
            break;
        case 3: typeStr =  "文档";
            break;
        case 4: typeStr =  "问答";
            break;
        case 5: typeStr = '代码';
            break;
        default:typeStr =  "其它";
    }
    return typeStr;
};

exports.getNodeAndContent = function (list, callback) {
    var nodeIds = [];
    var contentIds = [];
    for (var i = 0; i < list.length; i++) {
        nodeIds.push(list[i].knowledge_id);
        contentIds.push(list[i].content_id);
    }
    async.parallel([
        function (cb) {
            //根据id获取知识点
            knowledge.getByIds(nodeIds, function (err, nodes) {
                if (err) {
                    cb(err, {})
                } else {
                    var knowledgeHash = {};
                    nodes.forEach(function (no) {
                        knowledgeHash[no.id] = no.name;
                    });
                    cb(err, knowledgeHash);
                }
            });
        }, function (cb) {
            //根据id获取收录内容
            content.getByIds(contentIds, function (err, contents) {
                if (contents) {
                    var contentHash = {};
                    contents.forEach(function (con) {
                        contentHash[con.id] = [con.title,con.url];
                    })
                    cb(err, contentHash);
                } else {
                    cb(err, {});
                }
            });
        },
        function (cb) {
            //获取所有知识库
            getAllBases(function(err,bases ,baseHash){
                cb(err,bases,baseHash)
            })
        }
    ], function (err, result) {
        if (err) {
            callback(err, {}, {},[], {});
        } else {
            callback(err, result[0], result[1], result[2][0],result[2][1]);
        }
    })
}

//获取所有知识库
exports.getAllBase = function(callback){
    getAllBases(callback);
}
function getAllBases(callback){
    base.getAll(function (err, bases) {
        if (err) {
            cb(err, {});
        } else {
            var baseHash = {};
            bases.forEach(function (ba) {
                baseHash[ba.id] = ba.name;
            });
            callback(err,bases ,baseHash)
        }
    });
}
//根据contentid查询收录信息
exports.getAllByContentIds = function(content_ids,callback){
    var sql = "select * from expert_confirm_content where status=@status group by content_id having content_id in (" + content_ids.join(',') + ")";
    var params = {status:1}
    sqlHelper.ExecuteDataTable('knowledge',sql,params,callback);
}
//根据关键词从数据端搜索数据
exports.getDataByKey = function(page,pagesize,params,callback){
    /*var base_id = params.base_id;
    var key = params.keys;
    var create_at = params.create_at;
    var content_type = params.content_type;

    var query = {"term":{"status":1}};
    var queryAnd = [];
    if (base_id && base_id != 'all') {
        queryAnd.push({"term" : {
            "base_id": base_id
        }});
    }

    if (create_at && create_at != '') {
        query["range"] = {
            "create_at": {
                "from": create_at + " 00:00:00",
                "to": create_at + " 23:59:59"
            }
        };
    }

    if (content_type && content_type != 'all') {
        queryAnd.push({
            "term": {
                "content_type": content_type
            }
        });
    }
    query['and'] = queryAnd;
    query["bool"] = {
        "must": [
            {
                "phrase": {
                    "title": key
                }
            }
        ]
    };

    var post_options = {
        url: setting.toPsearche.url + '?_client_=learning_knowledge&index_name= pro_knowledge_lib',
        method: 'post',
        headers: {
            'X-ACL-TOKEN': setting.toPsearche.token
        },
        json: true,
        body: {
            "query": query,
            "from": page - 1,
            "size": page_size,
            "fields": ["id", "title", "url", "type", "created_at", "user_name", "source_type","quality_score"]
        }
    };
//console.log(JSON.stringify(post_options));
    request(post_options, function (err, response, body) {
        console.log(body);
        if (err) {
            callback(err, null);
        } else {
            callback(err, body);
        }
    });*/
    var query_params = {'status': 1};
    var base_id = params.base_id;
    var create_at = params.create_at;
    var content_type = params.content_type;
    var key = params.keys;
    var knowledgeId = params.knowledge;
    var sql = "select E.* from( select id as cid from content where content.title like '%"+key
        +"%' ) as C left join expert_confirm_content as E on E.content_id = C.cid where E.status=@status ";
    
    if(params.content_ids && params.content_ids.length > 0){
        sql += " and E.content_id not in ( " + params.content_ids.join(',') +") ";
    }

    if(base_id && base_id != 'all'){
        sql += " and E.base_id=@base_id ";
        query_params['base_id'] = base_id;
    }
    if(knowledgeId && knowledgeId != 0){
        sql += " and E.knowledge_id=@knowledgeId ";
        query_params['knowledgeId'] = knowledgeId;
    }
    if(create_at && create_at != ''){
        sql += " and E.create_at  >= @create_at and create_at <= @end_at ";
        query_params['create_at'] = create_at;
        query_params['end_at'] = create_at + ' 23:59:59'
    }
    if(content_type && content_type != 'all'){
        sql += " and E.content_type=@content_type ";
        query_params['content_type'] = parseInt(content_type);
    }
    sql+=" order by E.create_at desc ";
    sqlHelper.ExecuteDataByPage("knowledge", sql, query_params, page, pagesize, callback);
}
