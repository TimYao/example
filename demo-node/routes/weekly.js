var weeklyModel = require('../models/weekly');
var knowledgeContent = require("../models/knowledgeContent");
var ContentModel = require("../models/content");
var time = require('../utility/time')();
var logger = require("../utility/logger");
var baseModel = require("../models/base");

module.exports.autoroute = {
    get: {
        '/weekly/edit': edit,
        '/weekly/list': list,
        '/weekly/add': add,
        '/weekly/delete_content' : removeContent,
        '/weekly/publish' : publish,
        '/weekly/promotion' :promotion
    },
    post: {
        '/weekly/add_content' : addContent,
        '/weekly/editPromotion' : editPromotion
    }
};

function edit(req, res) {
    var username = req.session.user.userName;
    weeklyModel.certainWeekly(username).then(function(result){
        var weekly = result.weekly;
        var content = result.content;
        var promotion = result.promotion;
        res.render('weekly/edit', {weekly:weekly,content:content,promotion:promotion});
    }).catch(function(err){
        res.render('error/500',{error: "page 500: failed to find certain weekly"});
    });
}

//周报记录
function list(req, res){
    var page = req.query.page?req.query.page:1;
    var pageSize = 10;
    //获取所有周报内容
    weeklyModel.listShow().then(function(json) {
        var weekly = json.weekly;
        var content = json.content;
        var count = weekly.length?weekly.length*10:0;
        var promotion = json.promotion;
        var pageModel = require("../models/pagemodel")({
            linkformat: "/weekly/list?page=:page",
            querys: req.query,
            itemcount: count,
            current: page,
            size: pageSize
        });
        res.render('weekly/list', {pageModel: pageModel,content: content,weekly:weekly,weekly_page: page,promotion:promotion});
    }).catch(function(err){
        res.render('error/500',{error: "page 500: failed to find certain weekly record"});
    });
}

// 添加内容页面
function add(req,res){
    var date = req.query.date;
    // if(!date){
        date = time.shorttime();
    // }
    var baseId = parseInt(req.query.base_id);
    var page = req.query.page?req.query.page:1;
    var pageSize = 10;
    weeklyModel.contentShow(date,baseId,page,pageSize).then(function(list){
        var count = list.count; //总条目
        var content = list.content; //返回内容列表
        var base = list.base;
        var weekly = list.weekly;
        var params = {
            date: date,
            baseId: baseId,
            page: page
        }
        var pageModel = require("../models/pagemodel")({linkformat: "/weekly/add?page=:page",querys: req.query, itemcount: count, current: page, size:pageSize});
        res.render('weekly/add', {pageModel: pageModel,content:content,base:base,params:params,weekly:weekly});
    }).catch(function(err){
        console.log(err);
        res.render('error/404',{error: "page 404: failed to find content info"});
    });
}

//移除周报内容
function removeContent(req,res,next){
    var content_id = req.query.content_id;
    var weekly_id = req.query.weekly_id;
    weeklyModel.removeContent(content_id,weekly_id).then(function(status){
        res.redirect('/weekly/edit');
    }).catch(function(err){
        res.render('error/500',{error: "page 500: 周报移除内容失败"+err});
    });
}

//添加内容到周报
function addContent(req,res,next){
    var contentIds = req.body.contentIds;
    var weeklyId = req.body.weeklyId;
    var username = req.session.user.userName;
    weeklyModel.addContentToWeekly(weeklyId,contentIds,username).then(function(status){
        res.redirect('/weekly/edit');
    }).catch(function(err){
        res.render('error/500',{error: "page 500: 周报添加内容失败"+err});
    });
}

//发送周报
function publish(req, res) {
    var weeklyId = req.query.weeklyId;
    var username = req.session.user.userName;
    if(!weeklyId){
        return res.render('error/404',{error: "缺少参数"});
    }
    weeklyModel.publish(weeklyId,username).then(function(status){
        res.redirect('/weekly/list');
    }).catch(function(err){
        res.render('error/500',{error: "page 500: 周报发送失败"+err});
    });
}

//推广内容
function promotion(req,res) {
    var username = req.session.user.userName;
    weeklyModel.promotionShow(username).then(function(json){
        var weekly = json.weekly;
        var info = json.promotion;
        res.render('weekly/promotion',{info:info,weekly:weekly});
    }).catch(function(err){
        console.log(err);
    });
}

//添加推广
function editPromotion(req, res) {
    var info = req.body;
    var username = req.session.user.userName;
    weeklyModel.setPromotion(info,username).then(function(status){
        return res.json({err: 0, data: status});
    }).catch(function(err){
       return res.json({err: err, data: null});
    });
}