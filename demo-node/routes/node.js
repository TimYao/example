var node = require("../models/node");
var time = require("../utility/time")();
var Q = require('promise');
var logger = require("../utility/logger");
var tool = require("../utility/tool");

module.exports.autoroute = {
    get: {
        '/node/list' : list,
        '/node/edit' : edit
    },
    post: {
    	'/node/save' : save,
    	'/node/sort' : sort,
    	'/node/del' : del,
    	'/node/knowledge' : knowledge
    }
};

function knowledge(req, res){
	var id = req.body.pid;
	var level = req.body.level;

	if(!tool.confirmInt(id) || !tool.confirmInt(level)){
        res.render('error/404',{error: "参数错误"});
    }
	else{
		// 获取知识库baseId
		node.info(id).then(function(data){
			if(level == 1){
				var baseId = id;
			}
			else{
				if(data && data.id_path){
					var baseId = (data.id_path).split('-')[0];
				}
				else{
					throw new Error('获取数据失败');
				}
			}
			return node.knowledge(baseId); //获取知识库的知识点
		}).then(function(info){
			res.send({err: null, data: info});
		}).catch(function(err){
			logger.warn("failed to find knowledge list "+err);
			res.send({err: err, data: []});
			return Q.reject(err);
		});
	}
}

function list(req, res){
	var id = req.query.id;
	var level = req.query.level;
	if(level > 3){
		res.render('error/403',{error:"节点层级level不能大于3"});
	}
	else{
		// 分类列表
		node.list(id, level).then(function(info){
			res.render("node/list", {list:info});
		}).catch(function(err){
			logger.warn("failed to find node list "+err);
			res.render("error/403", {error: err});
			return Q.reject(err);
		});
	}
}

function edit(req, res){
	var parentId = req.query.pid ? req.query.pid : 0;
	var level = req.query.level;
	var nodeId = req.query.id ? req.query.id : 0;
	var title = req.query.title;
	var ptitle = req.query.ptitle;
	var child = 0; // 默认没有子节点
	var create = 1; // 默认新建
	var data; 

	if(!parentId || !level){
		res.render('error/403',{error:"缺少pid, level参数"});
	}
	else {
		if(nodeId){
			var newTitle = ptitle + ' > ' + title;
			// 获取节点信息
			node.nodeInfo(nodeId, level).then(function(result){
				data = result;
				data.pid = parentId;
				data.newTitle = newTitle;
				data.create = 0;
				res.render("node/edit", {list: data});
			}).catch(function(err){
				logger.warn("failed to find node info "+err);
				res.render('error/403',{error: "failed to find node info"});
				return Q.reject(err);
			});
		}
		else{
			var info = {'pid': parentId, 'level': level, 'child': child, 'create': create};
			var newTitle = ptitle + ' > 新建节点';
			info.newTitle = newTitle;
			info.knowledge = [];
			res.render("node/edit", {list: info});
		}
	}
}

function save(req, res){
	var info = req.body;
	var name = info.name;
	var desc = info.desc;
	info.opreator = req.session.user.userName;
	var knowledge = info.knowledge;

	if(!name || !desc || desc.length > 100 ){
		res.send({err: "确认数据填写"});
	}
	else{
		node.save(info).then(function(result){
			res.send({err: null});
		}).catch(function(err){
			logger.warn("failed to update/create node "+err);
			res.send({err: err});
			return Q.reject(err);
		});
	}
}

function del(req, res){
	var info = req.body;
	info.opreator = req.session.user.userName; // 操作者username
	var id = info.id;
	var level = info.level;
	if(!id || !level){
		res.render('error/403',{error:"缺少id, level参数"});
	}
	else {
		node.del(info).then(function(status){
			res.send({err:null});
		}).catch(function(err){
			logger.warn("failed to delete node "+err);
			res.send({err:err});
			return Q.reject(err);
		});
	}
}

function sort(req, res){
	var info = req.body;
	info.opreator = req.session.user.userName;
	var id = info.id;
	var level = info.level;

	// 排序
	node.sort(info,id).then(function(status){
		return node.list(id, level);
	}).catch(function(err){
		logger.warn("failed to sort node info "+err);
		return Q.reject(err);
	}).then(function(info){
		res.render("node/list", {list:info});
	}).catch(function(err){
		logger.warn("failed to find node list "+err);
		return Q.reject(err);
	});
}