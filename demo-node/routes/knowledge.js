var time = require("../utility/time")();
var Q = require('promise');
var formidable = require('formidable');
var logger = require("../utility/logger");
var knowledge = require("../models/knowledge");

module.exports.autoroute = {
    get: {
        '/knowledge/list' : list,
        '/knowledge/edit' : edit,
        '/knowledge/search' : search
    },
    post: {
        '/knowledge/save' : save,
        '/knowledge/del' : del,
        '/knowledge/search' : search
    }
};

function list(req, res){
	var baseId = req.query.base_id;
	var baseTitle = req.query.base_title;
    
	if(!baseId){
		res.render('error/403',{error:"缺少base_id参数"});
	}
	else {
		knowledge.list(baseId).then(function(result){
			    // 已选知识点和未选知识点
                var select = [];
                var noSelect = [];
                for (var i=0; i<result.length; i++){
                    if(result[i].status){
                        select.push(result[i]);
                    }
                    else{
                        noSelect.push(result[i]);
                    }
                }
                var data = {'select': select, 'noSelect': noSelect};
                var title = baseTitle + ' > 知识点列表';
                res.render('knowledge/list', {list: data, baseId: baseId, title: title, baseTitle: baseTitle});
		}).catch(function(err){
			logger.warn("failed to find knowledge list "+err);
			res.render('error/403',{error: "failed to find knowledge list"});
			return Q.reject(err);
		});
	}
}

function edit(req, res){
    var baseId = req.query.base_id;
    var id = req.query.id;
    var name = req.query.name;
    var baseTitle = req.query.base_title;

    if(!baseId && !id){
        res.render('error/403',{error:"缺少id参数"});
    }
    else{
        if(!id){
            var title = baseTitle + ' > ' + '新建知识点';
            res.render('knowledge/edit', {list: [], title: title, baseTitle: baseTitle, status: 1, baseId: baseId, id: id});
        }
        else {
            var title = baseTitle + ' > ' + name;
            knowledge.info(id).then(function(result){
                if(result){
                    var status = 0; //编辑状态
                }
                res.render('knowledge/edit', {list: result, title: title, baseTitle: baseTitle, status: status, baseId: baseId, id: id});
            }).catch(function(err){
                logger.warn("failed to find knowledge info "+err);
                res.render('error/403',{error: "failed to find knowledge info"});
                return Q.reject(err);
            });
        }

    }
}

function save(req, res){
    var data = req.body;
    data.opreator = req.session.user.userName;
    var name = data.name;
    var keys = data.keys;
    var baseId = data.baseId;
    var id = data.id;
    if(!baseId && !id){
        res.send({err:'确实id参数'});
    }
    else if(!name || !keys){
        res.send({err:'确认数据填写'});
    }
    else{
        knowledge.save(data).then(function(status){
            res.send({err:null});
        }).catch(function(err){
            logger.warn("failed to update/create knowledge "+err);
            res.send({err:err});
            return Q.reject(err);
        });
    }
}

function del(req, res){
    var data = req.body;
    var id = data.id;
    var opreator = req.session.user.userName;

    if(!id){
        res.render('error/403',{error:"缺少id参数"});
    }
    else{
        knowledge.del(id, opreator).then(function(status){
            if(status){
                res.send({err:null});
            }
            else{
                res.send({err:'该知识点已分配给专家'});
            }
        }).catch(function(err){
            logger.warn("failed to delete knowledge "+err);
            res.send({err:err});
            return Q.reject(err);
        });
    }
}

function search(req, res){
    var info = req.query;
    var page = info.page?info.page:1;
    var pagesize = 20;
    var baseName = info.domain;
    var key = info.keys;
    var knowledgeName = info.name;
    var knowledgeId;//info.knowledge_id;
    base = baseName.replace('知识库', '');

    if(!baseName || !key){
        res.render('error/403',{error:"缺少知识库和关键词参数"});
    }
    else{
        knowledge.search(base, knowledgeName, key, knowledgeId, page, pagesize).then(function(data){
            var cnt = data.count.total;
            var pageModel = require("../models/pagemodel")({linkformat: "/knowledge/search?page=:page",querys: req.query, itemcount: cnt, current: page, size:pagesize});
            res.render('knowledge/search', {list: data, baseName: baseName, knowledgeName: knowledgeName, keys: key, pageModel:pageModel});
        }).catch(function(err){
            logger.warn("failed to get psearch info "+err);
            res.render('error/403',{error: "failed to get psearch content info!"});
            return Q.reject(err);
        });
    }
}
