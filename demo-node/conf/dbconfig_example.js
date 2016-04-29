module.exports={
	redis: {
		host: '192.168.6.239',
		port: '6379'
	},
	mysql: {
		disable: false,
		knowledge:[
			{
				type:"master",
	            host:"192.168.6.125",
	            user: 'root',
	            password: 'root',
	            database:'knowledge',
	            port:3306
        	},
        	{
				type:"slave",
	            host:"192.168.6.125",
	            user: 'knowledge',
	            password: 'root',
	            database:'root',
	            port:3306
        	}
        ]
	}
};