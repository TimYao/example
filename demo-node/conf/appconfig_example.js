module.exports = {
	//session设置
	sessionConfig : {
        redisStore: {
            host: '192.168.6.211',
            port: 6379,
            prefix: "session"
        },
        secret : "recommand 128 bytes random string",
        maxAge : 60*60*1000
    },

    //日志目录
    log: {
    	path: '/home/node/workspace/knowledge_admin/logs/log'
    },
    // internalapi调用
    toPassport: {
        urlCheck: 'http://internalapi.csdn.net/passport/check/check/loginstatus',
        token: 'UQ-Z92GPBBzKsoiadLUcz4yZRggK'
    },
    toPsearche: {
        url: 'http://internalapi.csdn.net/psearch/psearch/query',
        token: 'DCK6fKf-XvhXDAwvGp9WrsqjpigK' 
    },
    toUc:{
        userInfo:'http://internalapi.csdn.net/uc/userinfo/userinfo/getbyusername',//获取用户信息
        token:'kzw5gJT7vD2skG1Dvy00gMo27igK'
    },
    toLib:{
        lib:'http://lib.csdn.net',//获取目录树
        token:''
    },
    // 青牛云配置文件
    qiniu: {
        access_key: "pK-x2BOx9YhUJtp6VYSKAHUDe4_7ih_doN3ZY8Og",
        secret_key: "XX5N4rRAq-j2TUlZ8Ndqd2jZv3TW52oAVA-Vy27L",
        scope: 'img-ink',
        domain: 'http://img.ink.csdn.net/',
        thumb_suffix: '-thumb.jpg'
    },
    // beta_admin配置
    betaAdmin: {
        disable: false,
        api: 'http://beta.admin.csdn.net/Services/PermissionService.asmx',
        applicationId: '98dcabf1-f96b-49ca-96a2-1310270d85d4',
        clientId: '2922fb76-666a-4887-b46d-c2110c15113d',
        targets: [
            {url: 'base', targetId: '85d0fe9a-2cf5-4b2a-ab59-a19b317bf125'},
            {url: 'node', targetId: '85d0fe9a-2cf5-4b2a-ab59-a19b317bf125'},
            {url: 'knowledge', targetId: '85d0fe9a-2cf5-4b2a-ab59-a19b317bf125'},
            {url: 'expert', targetId: 'eef190ca-e93d-48a5-995f-bb49817f95ce'},
            {url: 'topic', targetId: '7991fd7e-505f-41d9-9141-a398ae6af880'},
            {url: 'content', targetId: 'f9ee9831-a317-49ab-ac47-2dd1c76992fc'},
            {url: 'weekly', targetId: '4af03f03-52c2-4bb5-b2dd-f8353b6a3235'}
        ]
    }
};