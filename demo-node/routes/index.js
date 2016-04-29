module.exports.autoroute = {
    get: {
        '/' : index
    }
};

function index(req, res){
	res.render('error/403', { error: '知识库后台' });
}

