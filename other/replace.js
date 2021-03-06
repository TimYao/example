

$(function()
{
    var oReplace={
        replace:function()
        {
            $.ajax({
                type: 'get',
                url: 'http://internalapi.csdn.net/knowledge/public/public/api/words?x-acl-token=9DeJLGuYSy/6nSmDQen5amEWUh0K',
                //ajaxCache:true,
                async: false,
                dataType: 'jsonp',
                jsonp:'callback',
                success: function (resobj) {
                    if(resobj.msg == "ok")
                    {
                        var resData = resobj.data;
                        var storage = window.localStorage;
                        storage.setItem('preData',resData);
                        storage.setItem('realData',JSON.stringify(resData));

                        var strRealData = storage.realData;
                        data = eval(strRealData);

                        var wsCache = new WebStorageCache();
                        if(wsCache.isSupported())
                        {
                            wsCache.set(strRealData,'relData',{exp:86400});
                        }
                        handle($("#article_content"));
                    }
                },
                error: function () {
                    console.log("Send Ajax error ...")
                }
            });
        },
        classStyle:function(){
            var aReplace = $(".replace_word");
            aReplace.css({
                color:'#df3434',
                fontWeight:'bold!important'
            })
        }
    };
    var from_t = new Date().getTime();
    var data = localStorage.getItem('realData');
    data = eval(data);
    if(!data)
    {
        oReplace.replace();
    }
    else{
        handle($("#article_content"));
    }
    oReplace.classStyle();


    function handle(obj)
    {
        var regarr = [],
                arrUrl = [],
                arrTip = [],
                arrLogo = [],
                arrSubCount = [],
                arrConCount = [],
                arrWord = [];
        for(var a=0; a<data.length;a++)
        {
            data[a].flg = false;
        }
        var temp = obj.html();

        start(obj);
        function start(obj)
        {
            selectext(obj);
            //var ret = temp.replace(/(<p(\s+[^>]+)*>)(((?!<\/p)[\s\S])+)<\/p>/ig, function (pTagAll, tagOpen, tagAttr, subContent) {  //找到所有的p标签以及其内容
            var ret = temp.replace(/(<p>|<p\s+([^>]+>))(((?!<\/p)[\s\S])+)<\/p>/ig, function(pTagAll, tagOpen, tagAttr, subContent) {
                console.log(tagAttr);
                var modifiedContent = subContent.replace(/((<[^>]+>)*)([^<]*)/mig, function (all, tag, lastTag, text) { //对于所有p标签的内容，找到所有非标签文字
                    if (!tag) {
                        tag = '';
                    }
                    if (!text) {
                        text = '';
                    }
                    else {
                        if (tag.indexOf('<a') == 0 || arrWord.length === 0) { //a标签的内容不替换
                            text = text;
                        }
                        else {
                            var indexToDel = [];
                            for (var i in arrWord) {
                                var reg = arrWord[i].reg;
                                if (text.search(reg) !== -1 && i!="contain") {
                                    text = text.replace(reg, "{[(" + i + ")]}");
                                    indexToDel.push(i);
                                }
                            }
                            for(var j = 0; j<indexToDel.length; j++)
                            {
                                var index = indexToDel[j];
                                var sub = arrWord[index];
                                text = text.replace("{[(" + index + ")]}", "<a href=\"" + sub.url + "\" class='replace_word' title=\"" + sub.tip + "\" target='_blank' style='color:#df3434; font-weight:bold;'>" + sub.word + "</a>");
                                delete arrWord[index];
                            }
                        }
                    }
                    return tag + text;
                });
                return tagOpen + modifiedContent + '</p>';  //还原p标签
            });
            obj.html(ret);

        }
        function selectext(subs)
        {
            var oHtml = subs.text();
            var regflg = false;

            for(var i=0; i<data.length; i++)
            {
                var str = data[i].word;
                var regStr = /([\u4e00-\u9fa5]+)\w*/ig.test(str) ? str : '\\b'+str+'\\b';
                var Reg = new RegExp(regStr,'i');
                if(oHtml.search(Reg) !== -1)
                {
                    if(regarr.length<=0)
                    {
                        regarr.push((Reg+''));  //把正则转化为字符串
                    }else{
                        for(var e=0;e<regarr.length;e++)
                        {
                            if(Reg!=regarr[e])
                            {
                                regflg=true;
                            }else{
                                regflg = false;
                            }
                        }
                    }
                    if(regflg)
                    {
                        regarr.push((Reg+''));
                    }
                    regarr = unique(regarr);
                    var strUrl = data[i].url,
                            strTip = data[i].name,
                            strLogo = data[i].logo,
                            strSubCount = data[i].subCount,
                            strConCount = data[i].conCount,
                            strWord = data[i].word;
                    arrUrl.push(strUrl);
                    arrTip.push(strTip);
                    arrLogo.push(strLogo);
                    arrSubCount.push(strSubCount);
                    arrConCount.push(strConCount);
                    arrWord.push({
                        word: strWord,
                        url: strUrl,
                        tip: strTip,
                        reg: Reg
                    });

                }
            }
            arrWord = uniqueObj(arrWord);
        }

        //参考知识库
        function relate(){

            var relateHtml = '';
            var oRelate = document.getElementById('relate');
            if(arrTip.length<=0)
            {
                oRelate.style.display = 'none';
            }
            else{
                oRelate.style.display = 'block';

                arrTip = unique(arrTip);
                arrUrl = unique(arrUrl);
                arrTip = unique(arrTip);
                arrLogo = unique(arrLogo);
                arrSubCount = unique(arrSubCount);
                arrConCount = unique(arrConCount);

                for(var i =0; i<arrTip.length; i++)
                {
                    relateHtml += '<dl class="relate_list" ><dt><a target="_blank" href="'+arrUrl[i]+'"><img src="'+arrLogo[i]+'" alt="img"/></a></dt><dd><h4><a target="_blank" href="'+arrUrl[i]+'">'+arrTip[i]+'</a></h4><p><label><span>'+arrSubCount[i]+'</span><em>关注</em><i>|</i><span>'+arrConCount[i]+'</span><em>收录</em></label></p></dd></dl>'
                }
                $('.relate_c').html(relateHtml);
            }
        }
        relate();
        var from_to = new Date().getTime();
        console.log(from_to - from_t + 'ms');

    }
    function unique(arr) {
        var result = [], hash = {};
        for (var i = 0, elem; (elem = arr[i]) != null; i++) {
            if (!hash[elem]) {
                result.push(elem);
                hash[elem] = true;
            }
        }
        return result;
    }
    function uniqueObj(obj) {
        var arr = [];
        var words = [];
        if(obj.length){
            arr.push(obj[0]);
            words.push(obj[0].word);
            for(var i = 1; i < obj.length; i++) //从第二项开始遍历
            {
                words.push(obj[i].word);
                //如果当前数组的第i项在当前数组中第一次出现的位置不是i，
                //那么表示第i项是重复的，忽略掉。否则存入结果数组
                if (words.indexOf(obj[i].word) == i) arr.push(obj[i]);
            }
        }
        return arr;
    }
});


