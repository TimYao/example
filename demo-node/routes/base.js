var base = require("../models/base");
var image = require("../models/image");
var formidable = require('formidable');
var logger = require("../utility/logger");

module.exports.autoroute = {
    get: {
        '/base/list' : list,
        '/base/edit' : edit,
        '/base/release' : release
    },
    post: {
    	'/base/sort' : sort,
    	'/base/save' : save
    }
};

function sort(req, res){
	var info = req.body;
	info.opreator = req.session.user.userName;

	base.sort(info).then(function(status){
		// 重定向到首页
		res.redirect('/base/list');
	}).catch(function(err){
		logger.warn("failed to sort base "+err);
		return Q.reject(err);
	});
}

function list(req, res){
	var page = req.query.page?req.query.page:1;
	var pagesize = 20;
//console.log(page,pagesize);
	base.list(page, pagesize).then(function(info) {
		var cnt = info.count;
		var pageModel = require("../models/pagemodel")({linkformat: "/base/list?page=:page",querys: req.query, itemcount: cnt, current: page, size:pagesize});
		res.render("base/list",{list: info.data, pageModel: pageModel, remodel: 0});
	}).catch(function(err) {
		logger.warn("failed to find base list "+err);
		res.render('error/403',{error: "failed to find base list"});
	});
}

function edit(req, res){
	var baseId = req.query.base_id;
	var data = {'image_url': ''};
	if(baseId){
		// 获取知识库信息
		base.info(baseId).then(function(info) {
			res.render("base/edit",{list: info, remodel: 0});
		}).catch(function(err) {
			logger.warn("failed to find base info "+err);
			res.render('error/403',{error: "failed to find base info"});
		});
	}
	else{
		res.render("base/edit",{list: data, remodel: 0});
	}
}

function save(req, res){
	var directory = 'base';
	var opreator = req.session.user.userName;
	var info = {};
	// 获取post参数
	var form = new formidable.IncomingForm();
	form.parse(req, function(error, fields, files){
		info.id = fields.id;
		info.name = fields.name;
		info.description = fields.desc;
		info.color = fields.color;
		info.hover = fields.hover;
		info.image_url = fields.imageUrl;
		info.structure_url = fields.structureUrl;
		info.background_url = fields.backUrl;
		info.logo = files.logo;
		info.structure = files.structure
		info.background = files.back;
		if(!info.hover || !info.color || !info.name || !info.description || info.description.length > 300 || (info.logo.size == 0 && !info.image_url) || (info.structure.size == 0 && !info.structure_url) || (info.background.size == 0 && !info.background_url)){
			res.render("base/edit",{list: info, remodel: -1});
		}
		else{
			// 上传logo图片
			image.saveImg(info.logo, directory).then(function(url){
				if(url){
					info.image_url = url;
				}
				return image.saveImg(info.structure, directory);
			}).then(function(url){
				if(url){
					info.structure_url = url;
				}
				return image.saveImg(info.background, directory);
			}).then(function(url){
				if(url){
					info.background_url = url;
				}
				return base.save(info, opreator);
			}).then(function(count){
				if(!count){
					res.render("base/edit",{list: info, remodel: -1});
				}
				else {
					res.render("base/edit",{list: info, remodel: 1});
				}
			}).catch(function(err){
				logger.warn("failed to create/update base info "+err);
				res.render("base/edit",{list: info, remodel: -1});
			});
		}
	});
}

function release(req, res){
	var baseId = req.query.base_id;
	var opreator = req.session.user.userName;
	var remodel = -1;
	var pageModel = require("../models/pagemodel")({linkformat: "/base/list?page=:page",querys: req.query, itemcount: 0, current: 1, size:20});
	base.release(baseId, opreator).then(function(flag) {
		if(flag){
			remodel = 1;
		}
		else {
			remodel = 3;
		}
		res.render("base/list",{list: [], pageModel: pageModel, remodel: remodel});
	}).catch(function(err){
		logger.warn("failed to release base info "+err);
		res.render("base/list",{list: [], pageModel: pageModel, remodel: -1});
	});
}
