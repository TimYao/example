var async=require('async');
var baseModel = require('../models/base');
var expertModel = require('../models/expert');
var expertKnowledgeModel = require('../models/expertKnowledge');
var ExpertConfirmModel = require('../models/expertConfirm');
var ExpertReceiveModel = require('../models/expertReceive');
var nodeModel = require('../models/node');
var knowledgeModel = require('../models/knowledge');
var image = require("../models/image");
var ucModel = require("../models/uc");
var promise = require('promise');
var formidable = require('formidable');
var redisClient = require('../utility/redis')();

module.exports.autoroute = {
	get:{
		'/expert/add': add
		,'/expert/edit':edit
		,'/expert/list':list


		,'/expert/doAdd':doAdd
		,'/expert/doDel':doDel
		,'/expert/initTree':initTree
		,'/expert/doMangeKl':doMangeKl

		,'/expert/checkUserAjax':checkUserAjax
		,'/expert/getUnCompleteAjax':getUnCompleteAjax
	}
	,post:{
		'/expert/doAdd':doAdd
		,'/expert/doDel':doDel
		,'/expert/initTree':initTree
		,'/expert/doMangeKl':doMangeKl
		,'/expert/checkUserAjax':checkUserAjax
		,'/expert/getUnCompleteAjax':getUnCompleteAjax
	}
};


/**
 * 添加专家
 */
function add(req,res){

	baseModel.allBaseList().then(function(list){
		res.render('expert/add',{bases:list.data});
	}).catch(function(err){
		res.render('error/500',{'error':err});
	})

}

/**
 * 添加编辑提交
 * @param req
 * @param res
 *
 */
function doAdd(req,res){
	var operator = req.session.user.userName;
	var form = new formidable.IncomingForm();
	form.parse(req, function(error, fields, files){

		expertModel.doSave(fields,files,operator)
			.then(function(json_ret){
				if(json_ret['succ'] == 0){
					res.json(json_ret);
					return;
				}
				else
				{
					res.redirect('/expert/list');
				}
			}).catch(function(err){
				res.json({'succ':0,'msg':err});
				return;
			})

	})

}

function checkUserAjax(req,res){
	var username = req.param('username');
	var json_ret = {'succ':0,'msg':''};
	expertModel.checkInsert(username)
		.then(function(json_ret){
			res.json(json_ret);
			return;
		})
}

function getUnCompleteAjax(req,res){

	var username = req.param('expert');
	ExpertReceiveModel.getUnCompleteCount(username)
		.then(function(count){
			res.json(count);
		})
}

/**
 * 编辑
 */
function edit(req,res){
	var id = req.query.id;
	if(id == ""){
		res.render('error/403',{error:"参数错误！"});
		return;
	}
	var p1 = expertModel.getInfo(id);
	var p2 = baseModel.allBaseList();
	promise.all([p1, p2])
	.then(function (result) {
		var info = result[0].info;
		var bases = result[1].data;
		res.render('expert/edit',{'info':info,'bases':bases});
	});
}


/**
 * 删除
 */
function doDel(req,res){

	var id=req.param('id');
	var username = req.session.user.userName;
	expertModel.doDel(id,username).then(
			function(result){
				var ret = {'succ':0,'msg':''};
				if (result.affectNum > 0){
					ret['succ'] = 1;
					ret['msg'] = '删除成功';
 					res.json(ret);
				}else{
					ret['succ'] = 0;
					ret['msg'] = '删除失败';
					res.json(ret);
				}
			}
	)
}

/**
 * 列表
 */
function list(req,res){
	var page = req.query.page?req.query.page:1;
	var pagesize = 10;
	var base_id = req.query.baseId?req.query.baseId:0;

	var expertList;
	var expertCount;
	var bases;

	var p1= expertModel.getList(base_id,page,pagesize);
	var p2 = baseModel.allBaseList();
	promise.all([p1,p2])
	.then(function(result){
		expertList = result[0].rows;
		expertCount = result[0].count;
		bases = result[1].data;
		//所属知识库
		return expertModel.getExpertBase(expertList);

	})
	.then(function(q_result){
		expertList = q_result.list;
		//专家负责知识点
		return expertModel.getExpertKnowledge(expertList);

	})
	.then(function(q2_result){
		expertList = q2_result.list;
		var pageModel = require("../models/pagemodel")({linkformat: "/expert/list?page=:page",querys: req.query, itemcount: expertCount, current: page, size:pagesize});
		res.render('expert/list',{ pageModel:pageModel,bases:bases,expertList:expertList,searchBaseId:base_id});
	})
	.catch(function(err){
		res.render('error/500',{'error':err});
	})


}

/**
 * 专家分配知识点
 *array(
 * [0]=>undefined,
 * [1级节点]=>{'list'=>1级节点array({'id':,...}),'currId':当前选择的1级节点id}
 * [2级节点]=>{'list'=>2级节点array({'id':,...}),'currId':当前选择的2级节点id}
 * ....
 * [最后一级节点]=>{'list'=>最后级节点array({'id':,...'knowledges':,}),'currId':undefined}
 * )
 */

//function knowledge(req,res){
//	var expert = req.query.expert;
//	var nodeId = req.query.nodeId?req.query.nodeId:'';//1-2-3..
//
//	//共用变量
//	var baseId;
//
//	//专家负责的知识库
//	expertModel.getInfoByUsername(expert)
//		.then(function(infoRet){
//			baseId = infoRet.info.base_id;
//			//递归获取每级节点
//			return expertModel.getNodeTree(infoRet,nodeId);
//		})
//		.then(function(listRet){
//			if(listRet.length == 0){
//				res.render('expert/knowledge',{'data':[],'expert':expert,'baseId':baseId});
//				return;
//			}
//			//最后一级节点下的知识点
//			var key =listRet.length-1;
//			var endNode = listRet[key]['list'];
//			var endNodeIds =[];
//			var endNodeIdsStr;
//			endNode.forEach(function(node){
//				endNodeIds.push(node['id']);
//			})
//			endNodeIdsStr = endNodeIds.join(',');
//			return new promise(function(resolve, reject){
//				knowledgeModel.getListByNodeIds(endNodeIdsStr)
//					.then(function(klList){
//						klList = klList.rows;
//						for(i in endNode){
//							endNode[i]['knowledges'] = [];
//						}
//						for(i in endNode){
//							klList.forEach(function(kl){
//								if(endNode[i]['id'] == kl['node_id']){
//									endNode[i]['knowledges'].push(kl);
//								}
//							})
//						}
//						listRet[key]['list'] = endNode;
//						return resolve(listRet);
//					});
//			})
//
//		})
//		.then(function(list){
//			//专家负责的知识点
//			expertKnowledgeModel.getKownledgeByUser(expert).then(function(eks){
//				//是否知识点为选中状态
//				var key =list.length-1;
//				var endNode = list[key]['list'];
//				var eks = eks.knowledges||[];
//				for(i in endNode) {
//					var klList = endNode[i]['knowledges'];//知识点列表
//					if(klList.length > 0){
//						for(k in klList){
//							klList[k]['checked'] = false;
//							for(e in eks){//专家负责知识点列表
//								if(klList[k]['id'] == eks[e]['knowledge_id']){
//									klList[k]['checked'] = true;
//								}
//							}
//						}
//						endNode[i]['knowledges'] = klList;
//					}
//
//				}
//				res.render('expert/knowledge',{'data':list,'expert':expert,'baseId':baseId});
//			})
//
//		})
//
//
//
//}


function initTree(req,res){
	var dataid = req.query.dataid;
	var mid = req.query.mid;
	//var type = req.query._types;
	var is_knowledge = req.query.node_type;
	//二级节点
	if(dataid){
		nodeModel.initBaseTree(dataid).then(function(datas){
			res.json({status:true,title:datas.title,html:datas.html,selectedhtml:datas.msg,treelayer:true});
		},function(err){
			res.json({status:false,err:err});
		});
	}else if(mid && !is_knowledge){
		//其它几级节点
		nodeModel.initNodeTree(mid).then(function(html){
			res.json({status:true,html:html,treelayer:true})
		},function(err){
			res.json({status:false,err:err});
		});
	}else if (mid && is_knowledge){
		//获取知识点
		knowledgeModel.initKnowledgeTree(mid).then(function(html){
			res.json({status:true,html:html,treelayer:false});
		},function(err){
			res.json({status:false,err:err});
		})
	}
}


/**
 * 管理专家的知识点
 */
function doMangeKl(req,res){
	var ids = req.body.knowledge_ids;
	var expert = req.body.expert;
	ids = ids.replace(/[\[\]]/g,'');
	ids = ids.split(',');


	var klIds =[];//本次负责的知识点
	var baseId;
	for(var i in ids){
		if(i % 2 == 1){
			klIds.push(ids[i]);
		}
	}


	//var klIds = req.body['kl[]']||[];//本次负责的知识点
	//var baseId = req.body.baseId;
	//var expert = req.body.expert;
	//(typeof(klIds) == "string")?klIds=klIds.split(','):'';
	//var json_ret={'succ':0,'msg':''};

	expertModel.getInfoByUsername(expert).then(function(infoRet){
		baseId = infoRet.info.base_id;
		return expertKnowledgeModel.getKownledgeByUser(expert);
	}).then(function(knowledges){
		return expertModel.getUnCompleteMul(knowledges,klIds,expert);
	}).then(function(json_ret){
		if(json_ret['succ'] == 1){
			expertKnowledgeModel.doDel(expert,baseId)
				.then(function(ret){
					return expertKnowledgeModel.doInsertMul(klIds,baseId,expert);

				}).then(function(ret){
					// 删除专家负责知识点缓存
					var key = expert.toLowerCase().trim() + '_knowledgeId';
					redisClient.delete(key);
					return res.json({'succ':1,'msg':"修改成功"});
				}).catch(function(err){
					res.json(json_ret);
					return;
				})
		}else{
			res.json(json_ret);
			return;
		}

	}).catch(function(err){

			res.json(json_ret);
			return;
	})


}




