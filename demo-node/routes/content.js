var knowledgeContent = require("../models/knowledgeContent")
var time = require("../utility/time")();
var httpRequest = require('../utility/request')();
var promise = require('promise');
var async = require('async');
var baseModel = require("../models/base");
var knowledgeModel = require("../models/knowledge");
var contentModel = require("../models/content");

module.exports.autoroute = {
    get: {
        '/content/list' : includedContentList,
        '/content/new' : contentNew
    },
    post: {
        '/content/knowledge': knowledgeList,
        '/content/expert': expertList,
        '/content/confirm': confirm
    }
};

function confirm(req, res){
    var info = req.body;
    contentModel.confirmContent(info).then(function(status){
        res.send({err: 0, data: status});
    }).catch(function(err){
        console.log(err);
        res.send({err: err, data: null});
    });
}

function expertList(req,res){
    var baseId = req.body.baseId;
    var knowledgeId = req.body.knowledgeId;
    if(!baseId || !knowledgeId){
        return res.send({err: null, data: []});
    }
    contentModel.expertList(baseId,knowledgeId).then(function(result){
        res.send({err: null, data: result});
    }).catch(function(err){
        console.log(err);
        res.send({err: err, data: []});
    });
}

function knowledgeList(req, res){
    var baseId = req.body.baseId;
    if(!baseId){
        return res.send({err: null, data: []});
    }
    knowledgeModel.list(baseId,1).then(function(result){
        res.send({err: null, data: result});
    }).catch(function(err){
        console.log(err);
        res.send({err: err, data: []});
    });
}

function contentNew(req,res){
    baseModel.allBaseList().then(function(list){
        var base = list.data;
        res.render('content/new',{base:base});
    }).catch(function(err){
        console.log(err);
    });
}

function includedContentList(req, res,next){
    var page = req.query.page?req.query.page:1;
    //默认显示10条
    var pagesize = 10;
    var params = req.query;
    //收录内容列表
   async.waterfall([
        function(cb){
            if(params.keys && params.keys != ''){
                knowledgeContent.getDataByKey(page, pagesize,params,function(err,list,itemCount){
                    if(err){
                        console.log('get knowledge list failed.');
                        cb(err);
                    }else{
                        //时间处理,类型处理
                        for(var k in list){
                            list[k].create_at = time.jsDateTimeToStr(list[k].create_at);
                            list[k].content_type = knowledgeContent.contentTypeProcess(list[k].content_type);
                        }
                        cb(err,list,itemCount);
                    }
                })
            }else{
                knowledgeContent.getListByPage(page, pagesize,params,function(err,list,itemCount){
                    if(err){
                        console.log('get knowledge list failed.');
                        cb(err);
                    }else{
                        //时间处理,类型处理
                        for(var k in list){
                            list[k].create_at = time.jsDateTimeToStr(list[k].create_at);
                            list[k].content_type = knowledgeContent.contentTypeProcess(list[k].content_type);
                        }
                        cb(err,list,itemCount);
                    }
                })
            }

        },
        function(list,itemCount,cb){
            if(list.length > 0){
                knowledgeContent.getNodeAndContent(list,function(err,knowledgeHash,contentHash,bases,baseHash){
                    cb(err,list,itemCount,knowledgeHash,contentHash,bases,baseHash);
                });
            }else{
                knowledgeContent.getAllBase(function(err,bases,baseHash){
                    cb(err,list,itemCount,{},{},bases,baseHash);
                })
            }
        }
    ],function(err,list,itemCount,knowledgeHash,contentHash,bases,baseHash){
        if(err){
            res.render('error/500');
        }else{
            var pageModel = require("../models/pagemodel")({linkformat: "/content/list?page=:page",querys: req.query, itemcount: itemCount, current: page, size:pagesize});
            res.render('content/list',{params:params,pageModel:pageModel,knowledgeHash:knowledgeHash,contentHash:contentHash,bases:bases,baseHash:baseHash,list:list});
        }
    });
}

