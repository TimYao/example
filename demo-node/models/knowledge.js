var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var async = require('async');
var promise = require('promise');
var httpRequest = require('../utility/request')();
var configPsearch = require('../conf/appconfig').toPsearche;
var expert = require('./expertKnowledge');
var treeModel = require('./tree');


exports.initKnowledgeTree = initKnowledgeTree;
exports.getByNodeId = getByNodeId;
exports.knowledgeList = knowledgeList;

//获取知识点列表(专家分配知识点弹层)
function initKnowledgeTree(node_id){
    var idArray = node_id.split('-');
    idArray.pop();
    return new promise(function(resolve,reject){
        getByNodeId(idArray[idArray.length-1]).then(function(knowledges){
            var html = '';
            for(var i in knowledges){
                html += '<li><span class="subc">' + knowledges[i].name + '</span><a href="" data-id="' + knowledges[i].id + '"><em></em></a></li>';
            }
            return resolve(html);
        },function(err){
            return reject(err);
        });
    });
}
//根据节点id获取知识点列表(专家分配知识点弹层)
function getByNodeId(node_id){
    return new promise(function(resolve,reject){
        var sql = "select * from knowledge where node_id = @node_id and status=@status";
        var params={node_id:node_id,status:1};
        sqlHelper.ExecuteDataTable("knowledge",sql,params,function(err,knowledges){
            if(err){
                return reject(err);
            }else{
                return resolve(knowledges);
            }
        });
    });
}

//根据base id获取节点下是否有知识点
exports.getKnowledgeCount = function(tree) {
    return new promise(function (resolve, reject) {
        var haveConNode = treeModel.nodeConNum(tree);
        return resolve(haveConNode);
    });
}

// 根据nodeId获取知识点个数
exports.knowledgeCount = function(nodeId){
    return new promise(function(resolve, reject) {
        var sql = "select node_id, count(*) as count from knowledge where node_id=@nodeId and status=@status";
        var params = {'nodeId': nodeId, 'status': 1}; // status: 1为正常 -1为删除
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

//根据id获取知识点
exports.getByIds = function (ids,callback) {
    var sql = "select * from knowledge where id in ("+ids.join(',')+")";
    var params = {};
    sqlHelper.ExecuteDataTable ("knowledge", sql, params, callback);
};

function knowledgeList(baseId, callback){
    var sql = "select * from knowledge where base_id=@baseId and status=@status order by name";
    var params = {baseId: baseId, status: 1};
    sqlHelper.ExecuteDataTable ("knowledge", sql, params, callback);
}

//获取节点下的知识点
exports.getListByNodeIds = function(endNodeIdsStr){
    return new promise(function(resolve, reject){
        var sql="select * from knowledge where node_id in("+endNodeIdsStr+") and status=1";
        var params = {};
        sqlHelper.ExecuteDataTable ("knowledge", sql, params, function(err,rows){
            if(err){
                return reject(err);
            }
            else
            {
                return resolve({rows:rows});
            }
        });
    })
}
//根据ids获取知识点信息
exports.getListByIds = function(ids_str){
    return new promise(function(resolve, reject) {
        var sql = "select * from knowledge where id in(" + ids_str + ") and status=1";
        var params = {};
        sqlHelper.ExecuteDataTable("knowledge", sql, params, function (err, kownledges) {
            if(err){
                return reject(err);
            }
            else {
                return resolve(kownledges);
            }
        });
    })
}

// 获取某个nodeId的知识点列表
exports.fewList = function(nodeId){
	return new promise(function(resolve, reject) {
		var sql = "select * from knowledge where node_id=@nodeId and status=@status";
		var params = {'nodeId': nodeId, 'status': 1}; // status: 1为正常 -1为删除
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

// 获取某个baseId下的知识点列表
exports.list = function(baseId, status){
    return new promise(function(resolve, reject) {
        if(status){
            var sql = "select * from knowledge where base_id=@baseId and status=@status order by name";
            var params = {'baseId': baseId, status: status};
        }
        else{
            var sql = "select * from knowledge where base_id=@baseId and status!=@status order by name";
            var params = {'baseId': baseId, status: -1};
        }
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

// 获取特定的知识点信息
exports.info = function(id){
    return new promise(function(resolve, reject) {
        var sql = "select * from knowledge where id=@id and status!=@status";
        var params = {'id': id , 'status': -1};
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

exports.save = function(info){
    var baseId = info.baseId;
    var id = info.id;
    var name = info.name;
    var keys = info.keys;
    var opreator = info.opreator;
    var time = new Date();
    return new promise(function(resolve, reject) {
        if(id){
            // update
            var sql = "update knowledge set name=@name, key_words=@keys, opreator=@opreator, update_at=@time where id=@id";
            var params = {'id': id, 'name': name, 'keys': keys, 'opreator': opreator, 'time':time};
        }
        else{
            // insert
            var sql = "insert into knowledge (name, key_words, base_id, create_at, opreator, status) values (@name, @keys, @baseId, @time, @opreator, @status) ";
            var params = {'name': name, 'keys': keys, 'baseId': baseId, 'time': time, 'opreator': opreator, 'status': 0};

        }
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
            if(err){
                return reject(err);
            }
            else {
                // 删除缓存
                if(baseId){
                    var key = 'tree_user_' + baseId;
                    redisClient.delete(key);
                    key = 'tree_expert_' + baseId;
                    redisClient.delete(key);
                }
                return resolve(count);
            }
        });
    });
}

exports.del = function(id, opreator){
    return new promise(function(resolve, reject) {
        //判断是否该知识点已分配给专家
        expert.exist(id).then(function(count){
            if(count > 0){ // 知识点已分配
                return resolve(false);
            }
            else {
                return knowledgeDel(id, opreator);
            }
        }).catch(function(err){
            return reject(err);
        }).then(function(info){
            return resolve(true);
        }).catch(function(err){
            return reject(err);
        });
    });
}

function knowledgeDel(id, opreator){
    return new promise(function(resolve, reject) {
        var time = new Date();
        var sql = "update knowledge set status=@status, update_at=@time, opreator=@opreator where id=@id ";
        var params = {'id': id, 'status': -1, 'time': time, 'opreator': opreator};
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
            if(err){
                return reject(err);
            }
            else {
                return resolve(count);
            }
        });
    });
}

exports.nodeDel = function(nodeId){
    return new promise(function(resolve, reject) {
        var sql = "update knowledge set node_id=0, status=0 where node_id=@nodeId";
        var params = {'nodeId': nodeId};
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
            if(err){
                return reject(err);
            }
            else {
                return resolve(count);
            }
        });
    });
}

exports.update = function(id, nodeId, opreator){
    return new promise(function(resolve, reject) {
        var time = new Date();
        var sql = "update knowledge set node_id=@nodeId, status=@status, update_at=@time, opreator=@opreator where id=@id";
        var params = {id: id, nodeId: nodeId, status: 1, time: time, opreator: opreator};
        sqlHelper.ExecuteNoQuery("knowledge", sql, params, function(err, count){
            if(err){
                return reject(err);
            }
            else {
                return resolve(count);
            }
        });
    });
}

exports.search = function(baseName, knowledgeName, key, knowledgeId, page, pagesize){
    return new promise(function(resolve, reject) {
        var url = configPsearch.url;
        //url += '?_client_=learning_knowledge&index_name=so_blog,pro_course_v2,so_doc,pro_ask_topic,so_code,pro_iteye_blog';
        url += '?_client_=learning_knowledge&index_name=so_blog,pro_iteye_blog';
        if(knowledgeId)
            url+='&knowledge_id='+knowledgeId;
        var token = configPsearch.token;
        var json = getArgs(key);
        console.log(url,token,JSON.stringify(json));
        httpRequest.getDataBody(url, 'POST', json, token, function(err) {
            return reject(err);
        },function(body){
            try{
                var result = eval(body);
                var data = result.hits;
            }
            catch(exception){
                var data = [];
            }
            var total = result.total_hits;
            var result = manipulation(data, page, pagesize,total);
            return resolve(result);
        });
    });
}

//组合参数信息
function getArgs(key, indexName){
    var json = {};
    if(key.indexOf(',') == -1){
        var must = [];
        // 只有且集
        var keys = key.split('+');
        for(var k in keys){
            must.push({
                'phrase': {
                    'title,tag': keys[k]
                }
            });
        }
        var query = {
            'bool':{
                'should': [{
                    'bool':{
                        'must':must
                    }
                }]
            }
        };
    }
    else{
        var should = new Array();
        //存在或集合
        var keys = key.split(',');
        for(var k in keys){
            var contents = keys[k].split('+');
            var item = {};
            var must = new Array();
            for(var m in contents){
                must.push({
                    'phrase': {
                        'title,tag': contents[m]
                    }
                });
            }
            item.bool = {'must':must};
            should.push(item);
        }
        should.minimum_number_should_match = 1;
        var query = {
            'bool':{
                'should':should
            }
        }
    }
    json = {
        'query': query,
        'from': 0,
        'size': 100,
        'fields': ["id", "title", "url", "type", "created_at", "user_name", "source_type","quality_score"]
    }
    console.log(JSON.stringify(json));
    return json;
}

exports.noSelect = function(baseId){
    return new promise(function(resolve, reject) {
        var sql = "select * from knowledge where base_id=@baseId and status=@status and node_id=@nodeId";
        var params = {'baseId': baseId, 'status': 0, 'nodeId': 0};
        console.log(sql,params);
        sqlHelper.ExecuteDataTable("knowledge", sql, params, function(err, info){
            if(err){
                return reject(err);
            }
            else {
                return resolve(info);
            }
        });
    });
}


function manipulation(data, page, pagesize,total){
    var article = 0;
    var doc = 0 ;
    var video = 0;
    var ask = 0;
    var code = 0;
    
    for(var k in data){
        if(data[k]._index.indexOf("so_blog") == 0 || data[k]._index.indexOf("pro_iteye_blog") == 0){
            data[k].object.dataType = '文章';
            article ++;
        }
        else if(data[k]._index.indexOf("pro_course_v2") == 0){
            data[k].object.dataType = '视频';
            video ++;
        }
        else if(data[k]._index.indexOf("so_doc") == 0){
            data[k].object.dataType = '文档';
            doc ++;
        }
        else if(data[k]._index.indexOf("pro_ask_topic") == 0){
            data[k].object.dataType = '问答';
            ask ++;
        }
        else if(data[k]._index.indexOf("so_code") == 0){
            data[k].object.dataType = '代码';
            code ++;
        }
    }
    var start = (page-1)*pagesize;
    var end = start + pagesize;
    var arr = data.slice(start, end);
    var count = {'article': article, 'doc': doc, 'video': video, 'ask': ask, 'code': code, 'total': total};
    var result = {'count': count, 'data':arr};
    return result;
}
