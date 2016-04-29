var config = require('../conf/dbconfig').mysql;
var sqlHelper = require('../utility/mysql')(config);
var redisClient = require('../utility/redis')();
var async = require('async');
var promise = require('promise');
var base = require("./base");
var knowledge = require("./knowledge");
var timer = require("../utility/time")();
var expertModel = require("./expert");
var expertKnowledgeModel = require("./expertKnowledge");
var treeModel = require('./tree');

exports.className = className;
exports.info = info;
exports.getItem = getItem;
exports.initBaseTree = initBaseTree;
exports.getByIds = getByIds;
exports.initNodeTree = initNodeTree;
exports.getIdPath = getIdPath;

/**
 * ==================================================
 * 					专家分配知识点弹层
 * ==================================================
 */
//点击分配知识点 初始化弹框数据
function initBaseTree(expert){
	return new promise(function(resolve, reject){
		var base_name = "";
		var base_id = '';
		var knowledgeHash = {};
		var subNodeHash = {};
		var nodes;
		var tree;

		expertModel.getInfoByUsername(expert).then(function(infoRet){
			//专家负责知识库
			base_id = infoRet.info.base_id;
			return base.info(base_id);
		}).then(function(base){
			base_name = base.name;
			return treeModel.tree(base_id);
		}).then(function(treeRet){
			tree = treeRet;
			return knowledge.getKnowledgeCount(tree);
		}).then(function(haveConNode){
			//知识库下有知识点的集合
			knowledgeHash = haveConNode;
			//知识库下有子节点的集合
			return subNodeCount(tree);
		}).then(function(haveChildNode){
			subNodeHash = haveChildNode;
			//所有一级节点
			return getNodesByBaseId(tree,base_id);
		}).then(function(firstNodes){
			nodes = firstNodes;
			//专家已选择的知识点
			return getExpertSelected(expert);
		}).then(function(selectedHtml){
			var html = '<ul class="listdown treeMenu">';
			for(var i in nodes){
				if(subNodeHash[nodes[i].id]){
					html += '<li><a href="" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}else if(knowledgeHash[nodes[i].id]){
					html += '<li><a href="" class="nosub" data-type="knowledge" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}else{
					html += '<li><a href="" class="nosub noclick" data-type="knowledge" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}
			}
			html += '</ul>';
			var title=base_name;
			var msg = selectedHtml;
			return resolve({html:html,msg:msg,title:title})
		}).catch(function(err){
			return reject(err);
		})
	});
}

function _nodeIdPath(nids,newNlist){
	return new promise(function(resolve,reject){
		if(nids.length > 0){
			getByIds(nids).then(function(nlist){
				for (var i = 0; i < nlist.length; i++) {
					newNlist[nlist[i].id] = nlist[i];
				}
				return resolve(newNlist);
			}).catch(function(err){
				return reject(err);
			})
		}else{
			return resolve(newNlist);
		}

	})
}
//弹层专家已选择的知识点
function getExpertSelected(expert){
	return new promise(function(resolve,reject){
		expertKnowledgeModel.getKownledgeByUser(expert).then(function(expertks){
			expertks = expertks.knowledges;
			var msg='';
			//知识点所属的节点路径
			var kids =[];
			var nodeids = [];
			for(var i=0;i<expertks.length;i++){
				kids.push(expertks[i]['knowledge_id']);
			}
			if(kids.length > 0){
				var newKlist = {};
				var newNlist = {};
				knowledge.getListByIds(kids.join(',')).then(function(klist){
					for(var i=0;i<klist.length;i++){
						newKlist[klist[i].id] = klist[i];
						nodeids.push(klist[i]['node_id']);
					}
					return getByIds(nodeids);
				}).then(function(nlist) {
					//节点列表
					var nids = [];
					for (var i = 0; i < nlist.length; i++) {
						newNlist[nlist[i].id] = nlist[i];
						//id_path中的节点信息
						var path = nlist[i].id_path;
						path = path.split("-");
						for (var j = 1; j < path.length - 1; j++) {
							nids.push(path[j]);
						}
					}
					return _nodeIdPath(nids,newNlist);
				}).then(function(newNlist){
					newNlist = newNlist;

					//拼接数据
					for(var i in newKlist){
						msg +='<li class="clearfix" data-tabid="'+newKlist[i].id+'">';
						//知识点的名字
						var currKid = newKlist[i].id;
						newKlist[currKid]['name'] = newKlist[i].name;
						//知识点路径名称
						var currNode = newKlist[i].node_id;
						var path = newNlist[currNode].id_path;
						path = path.split('-');
						var pathName ='';
						for(var j=1;j<(path.length-1);j++){
							path[j] = parseInt(path[j]);
							pathName += newNlist[path[j]].name+'-';
						}
						newKlist[currKid]['pathName'] = pathName + newNlist[currNode].name;

						msg +='<span>'+newKlist[currKid]['pathName']+'-<em>'+newKlist[currKid]['name']+'</em>'+'</span><a href="" class="rubbish"></a>';
						msg +='</li>';
					}
					return resolve(msg);
				}).catch(function(err){
					return reject(err);
				})
			}else{
				return resolve(msg);
			}

		}).catch(function(err){
			return reject(err);
		})

	})

}
//获取每个节点的子节点个数
function subNodeCount(tree){
	return new promise(function(resolve,reject){
		var haveChildNode = treeModel.nodeHaveChildNode(tree);
		return resolve(haveChildNode);

	});
}
//根据知识库获取二级节点
function getNodesByBaseId(tree,baseId){
	return new promise(function(resolve,reject){
		//var sql = "select * from node where parent_id=@base_id and level=1 and status=@status order by sort";
		//var params = {base_id:base_id,status:1};
		//sqlHelper.ExecuteDataTable("knowledge",sql,params,function(err,nodes){
		//	if(err){
		//		return reject(err);
		//	}else{
		//		return resolve(nodes);
		//	}
		//});
		var firstNode = treeModel.getLevel1(tree,baseId);
		return resolve(firstNode);
	});
}

//根据id获取节点
function getByIds(ids) {
	return new promise(function(resolve, reject) {
		var sql = "select * from node where id in ("+ids.join(',')+")";
		var params = {};
		sqlHelper.ExecuteDataTable ("knowledge", sql, params, function(err,list){
			if(err){
				return reject(err);
			}else{
				return resolve(list);
			}
		});
	})

};
//获取子节点
function getSubNodes(tree,idPath){
	return new promise(function(resolve,reject){
		//var sql = "select * from node where parent_id=@parent_id and level != 1 and status=@status order by sort";
		//var params = {parent_id:parent_id,status:1};
		//sqlHelper.ExecuteDataTable("knowledge",sql,params,function(err,nodes){
		//	if(err){
		//		return reject(err);
		//	}else{
		//		return resolve(nodes);
		//	}
		//});
		var childNode = treeModel.childNode(tree,idPath);
		return resolve(childNode);
	});
}
//弹层下级节点初始化
function initNodeTree(ids){
	return new promise(function(resolve,reject){
		var tree;
		var idArray = ids.split('-');
		idArray.pop();
		var subNodeHash = {};
		var knowledgeHash = {};
		treeModel.tree(idArray[0]).then(function(treeRet){
			tree = treeRet;
			return knowledge.getKnowledgeCount(tree);
		}).then(function(haveConNode){
			knowledgeHash = haveConNode;
			return subNodeCount(tree);
		},function(err){
			return reject(err);
		}).then(function(haveChildNode){
			subNodeHash = haveChildNode;
			//return getSubNodes(idArray[idArray.length-1]);
			return getSubNodes(tree,idArray);
		},function(err){
			return reject(err);
		}).then(function(nodes){
			if(nodes.length > 0 && nodes[0].level == 3){
				var  html = '<ul class="lastul">';
			}else{
				var  html = '<ul class="subul">';
			}
			for(var i in nodes){
				if(subNodeHash[nodes[i].id]){
					html += '<li><a href="" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}else if(knowledgeHash[nodes[i].id]){
					html += '<li><a href="" class="nosub" data-type="knowledge" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}else{
					html += '<li><a href="" class="noclick nosub" data-type="knowledge" data-mid="' + nodes[i].id_path + nodes[i].id + '-"><em>' + nodes[i].name + '</em></a></li>';
				}
			}
			html += '</ul>';
			return resolve(html);
		},function(err){
			return reject(err);
		});
	});
}
/**
 * ==================================================
 * 				专家分配知识点弹层end
 * ==================================================
 */

exports.knowledge = function(baseId){
	// 选取baseId知识库的未选知识库列表
	return new promise(function(resolve, reject) {
		knowledge.noSelect(baseId).then(function(info){
			return resolve(info);
		}).catch(function(err){
			return reject(err);
		});
	});
}

exports.nodeInfo = function(id, level){
	var result;
	return new promise(function(resolve, reject) {
		info(id).then(function(info){
			result = info;
			level = parseInt(level) + 1;
			return getItem(id, level); // 判断是否有子节点
		}).catch(function(err){
			return reject(err);
		}).then(function(info){
			if(info.length > 0){
				result.child = 1; // 含有子节点

			}
			else {
				result.child = 0; // 不含有子节点
			}
			// 获取该节点知识点
			return nodeKnowledge(result.id, result.child);
		}).catch(function(err){
			return reject(err);
		}).then(function(data){
			result.knowledge = data;
			var string = '';
			for(var k in data){
				if(string){
					string += ','+'['+data[k].id+':'+data[k].name+']';
				}
				else{
					string = '['+data[k].id+':'+data[k].name+']';
				}
			}
			result.string = string;
			return resolve(result);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function nodeKnowledge(id, child){
	return new promise(function(resolve, reject) {
		if(child){ // 不需要取知识点
			return resolve([]);
		}
		else {
			knowledge.fewList(id).then(function(data){
				return resolve(data);
			}).catch(function(err){
				return reject(err);
			});
		}
	});
}

exports.list = function(id, level){
	var name; // 名称
	var list = {};
	var next = parseInt(level) + 1;
	return new promise(function(resolve, reject) {
		className(id, level).then(function(nameInfo){
			name = nameInfo;
			return getItem(id, level);
		}).catch(function(err){
			return reject(err);
		}).then(function(results){
			list.name = name;
			var data = [];
			var nodeIds = new Array();
			for(var i=0; i<results.length; i++){
				results[i].create_at = timer.jsDateTimeToStr(results[i].create_at);
				data.push(results[i]);
				nodeIds.push(results[i].id);
			}
			list.data = data;
			list.level = {'current': level, 'next': next};
			list.hash = capital(level);
			list.id = id;
			if(nodeIds.length > 0){
				// 判断nodeId下是否存在知识点
				return getKnowledge(nodeIds);
			}
			else {
				return resolve(list);
			}
		}).catch(function(err){
			return reject(err);
		}).then(function(knowledgeInfo){
			for(var k in list.data){
				for(var m in knowledgeInfo){
					if(list.data[k].id == knowledgeInfo[m].node_id){
						list.data[k].knowledge = knowledgeInfo[m].count;
					}
				}
			}
			return resolve(list);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function getKnowledge(ids){
	var promises = ids.map(function (id) {
        return knowledge.knowledgeCount(id); // 获取节点下知识点个数
    });
    return new promise.all(promises);
}

function className(id, level){
	// 获取当前层级名称
	var name;
	var baseId;
	var node;
	return new promise(function(resolve, reject) {
		path(id, level).then(function(info){
			if(level == 1){
				name = info.name+'知识库';
				return resolve(name);
			}
			else{
				idPath = info.id_path + id;
				ids = idPath.split('-');
				baseId = ids[0];
				ids = ids.splice(1, ids.length);
				return nodeName(ids);
			}
		}).catch(function(err){
			return reject(err);
		}).then(function(nodeInfo){
			for(var i=0; i<nodeInfo.length; i++){
				if(node){
					node += ' > ' + nodeInfo[i].name;
				}
				else{
					node = nodeInfo[i].name;
				}
			}
			return base.info(baseId);
		}).catch(function(err){
			return reject(err);
		}).then(function(baseInfo){
			name = baseInfo.name + '知识库' + ' > ' + node;
			return resolve(name);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function nodeName(ids){
	var promises = ids.map(function (id) {
        return info(id); // 获取节点信息
    });
    return new promise.all(promises);
}

function path(id, level){
	return new promise(function(resolve, reject) {
		if(level > 1){
			info(id).then(function(info){
				return resolve(info);
			}).catch(function(err){
				return reject(err);
			});
		}
		else{
			base.info(id).then(function(info){
				return resolve(info);
			}).catch(function(err){
				return reject(err);
			});
		}
	});
}

function info(nodeId,status){
	var sql = "select * from node where id=@nodeId and status=@status";
	if(status){
		var params = {'nodeId': nodeId, 'status': status};
	}
	else {
		var params = {'nodeId': nodeId, 'status': 1};
	}
	return new promise(function(resolve, reject) {
		sqlHelper.ExecuteDataRow("knowledge", sql, params, function(err, info){
			if(err){
				return reject(err);
			}
			else{
				return resolve(info);
			}
		});
	});
}

function getItem(id, level){
	return new promise(function(resolve, reject) {
		var sql = "select * from node where parent_id=@id and status=@status and level=@level ORDER BY sort";
		var params = {'id': id, 'status': 1, 'level': level};
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

exports.save = function(data){
	var knowledge = data.knowledge.split(',');
	var nodeId = data.id;
	var opreator = data.opreator;
	var baseId;

	return new promise(function(resolve, reject) {
		// 查看pid存在不存在知识点
		knowledgeCheck(data).then(function(info){
			if(info.length == 0){ // 不存在知识点， 可以创建节点
				return findPath(data); // 查询id_path
			}
			else{
				// 存在知识点 不可创建
				return reject('父节点已存在知识点');
			}
		}).catch(function(err){
			return reject(err);
		}).then(function(nodePath){
			if(nodePath){
				baseId = nodePath.split('-')[0];
			}
			data.path = nodePath;
			return saveNodeInfo(data); // 更新节点信息
		}).catch(function(err){
			return reject(err);
		}).then(function(info){
			if(info){
				nodeId = info;
			}
			return saveKnowledge(knowledge, nodeId, opreator);
		}).catch(function(err){
			return reject(err);
		}).then(function(status){
			// 删除缓存
			if(baseId){
				var key = 'tree_user_' + baseId;
				redisClient.delete(key);
				key = 'tree_expert_' + baseId;
				redisClient.delete(key);
			}
			return resolve(true);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function saveKnowledge(knowledgeList, nodeId, opreator){
	return new promise(function(resolve, reject) {
		if(knowledge.length == 0){
			return resolve(true);
		}
		else{
			var data = [];
			for(var k in knowledgeList){
				if(knowledgeList[k]){
					var id = (knowledgeList[k].split(':')[0]).replace('[', '');
					var name = (knowledgeList[k].split(':')[1]).replace(']', '');
					data.push({
						'id': id,
						'name': name
					});
				}
			}
			knowledge.nodeDel(nodeId).then(function(status){
				updateKnowledge(data, nodeId, opreator);
			}).catch(function(err){
				return reject(err);
			}).then(function(status){
				return resolve(true);
			}).catch(function(err){
				return reject(err);
			});
		}
	});
}

function updateKnowledge(data, nodeId, opreator){
	var promises = data.map(function (list) {
		var id = list.id;
        return knowledge.update(id, nodeId, opreator); // 更新知识库
    });
    return new promise.all(promises);
}

function knowledgeCheck(info){
	var level = parseInt(info.level);
	var nodeId = info.pid;
	return new promise(function(resolve, reject) {
		if(level > 1){
			return resolve(knowledge.fewList(nodeId));
		}
		else {
			return resolve([]);
		}
	});
}

function findPath(info){
	var nodePath;
	var level = parseInt(info.level);
	var pid = info.pid;
	return new promise(function(resolve, reject) {
		if(level > 1){
			path(pid, level).then(function(info){
				nodePath = info.id_path + pid + '-';
				return resolve(nodePath);
			}).catch(function(err){
				return reject(err);
			});
		}
		else {
			nodePath = pid + '-';
			return resolve(nodePath);
		}
	});
}

function saveNodeInfo(info){
	var id = info.id;
	var time = new Date();
	return new promise(function(resolve, reject) {
		if(id){
			// update
			var sql = "update node set name=@name, description=@desc, update_at=@time, opreator=@opreator where id=@id";
			var params = {'name':info.name, 'desc': info.desc, 'time': time, 'opreator':info.opreator, 'id': id};
		}
		else {
			// insert
			var sql = "insert into node (parent_id, name, description, id_path, level, create_at, opreator, status) values (@pid, @name, @desc, @idPath, @level, @time, @opreator, @status)";
			var params = {'pid': info.pid, 'name': info.name, 'desc': info.desc, 'idPath': info.path, 'level': info.level, 'time': time, 'opreator': info.opreator, 'status': 1};
		}
		sqlHelper.ExecuteInsert("knowledge", sql, params, function(err, id){
			if(err){
				return reject(err);
			}
			else {
				return resolve(id);
			}
		});
	});
}

exports.sort = function(info,baseId){
	var data = [];
	return new promise(function(resolve, reject) {
		// 获取id和sort值
		var ids = getIdPath(info);
		sortAll(ids).then(function(status){
			var key = 'tree_user_' + baseId;
			redisClient.delete(key);
			key = 'tree_expert_' + baseId;
			redisClient.delete(key);
			return resolve(status);
		}).catch(function(err){
			return reject(err);
		});
	});
}

function sortAll(ids){
	var promises = ids.map(function (id) {
    	return nodeSort(id); // 获取节点信息
    });
    return new promise.all(promises);
}

function nodeSort(data){
	return new promise(function(resolve, reject) {
		var time = new Date();
		var sql = "update node set sort=@sort, update_at=@time, opreator=@opreator where id=@id";
		var params = {'sort': data.sort, 'id': data.id, 'update_at': time, 'opreator': data.opreator};
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

function getIdPath(info){
	var data = [];
	var opreator = info.opreator;
	// 遍历参数 获取id和对应的sort值
	for(var k in info){
		if(k.indexOf("sort") == 0){
			var id = k.match(/\d/g).join("");
			var sort = info[k];
			data.push({
				'id': id,
				'sort': sort,
				'opreator': opreator
			});
		}
	}
	return data;
}

exports.del = function(data){
	var id = data.id;
	var level = parseInt(data.level)+1;
	var opreator = data.opreator;
	return new promise(function(resolve, reject) {
		// 判断子节点是否存在
		getItem(id, level).then(function(result){
			if(result.length > 0 ){ // 存在子节点, 不能删除
				return reject('已存在子节点');
			}
			else {
				return knowledge.fewList(id); 
			}
		}).catch(function(err){
			return reject(err);
		}).then(function(result){
			if(result.length > 0){
				return reject('已存在知识点');
			}
			else{
				return nodeDel(id, opreator);
			}
		}).catch(function(err){
			return reject(err);
		}).then(function(count){
			// 根据nodeId删除tree_baseId缓存
			cacheDelByNodeId(id);
			return resolve(count); // 变动行数
		}).catch(function(err){
			return reject(err);
		});
	});
}

function cacheDelByNodeId(nodeId){
	return new promise(function(resolve, reject) {
		var status = -1;
		info(nodeId,status).then(function(result){
			if(result){
				var path = result.id_path;
				var baseId = path.split('-')[0];
				var key = 'tree_user_' + baseId;
				redisClient.delete(key);
				key = 'tree_expert_' + baseId;
				redisClient.delete(key);
				return resolve(true);
			}
		}).catch(function(err){
			return reject(err);
		});
	});
}

function nodeDel(id, opreator){
	return new promise(function(resolve, reject) {
		var time = new Date();
		var sql = "update node set status=@status, opreator=@opreator, update_at=@time where id=@id";
		var params = {'id': id, 'status': -1, 'time': time, 'opreator': opreator};
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

function capital(level){
	var hash = {};
	if(level == 1){
		hash.current = '二';
		hash.next = '三';
	}
	else if(level == 2){
		hash.current = '三';
		hash.next = '四';
	}
	else if(level == 3){
		hash.current = '四';
		hash.next = '五';
	}
	else if(level == 4){
		hash.current = '五';
		hash.next = '六';
	}
	return hash;
}