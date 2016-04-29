/*!
 * jsPageNavigator v1.0.0
 *
 * Copyright 2012, Larky Liu
 * Date: 2012年8月9日 12:34:36
 */

//----------------------调用方法--------------------------
//var pager = new jsPageNavigator({
//	PageSumaryContainer: document.getElementById("PagerSumaryContainer")		//概览文字区域
//	,PrevClick: document.getElementById("pagePrevClick")		//上一页区域
//	,PagerClicks: document.getElementById("pagerClicks")		//下一页区域
//	,NextClick: document.getElementById("pageNextClick")		//数字区域
//});
//pager.SetupPager(@itemCount, pageSize, 3);		//总数，分页大小，分隔大小赋值
//
//pager.TurnToPage = function(pageIndex) {		//点击分页链接触发事件
//	$.ajax({type: "post"...
//		, success: function (data, textStatus) {             
//			...更新页面内容
//			pager.GetPager(pageIndex);		//更新分页导航
//		}});

function jsPageNavigator(parms){
    var _this = this;
    var _pageSumaryContainer = parms.PageSumaryContainer;
    var _prevClick = parms.PrevClick;
    var _pagerClicks = parms.PagerClicks;
    var _nextClick = parms.NextClick;
    var _firstClick = parms.FirstClick;
    var _lastClick = parms.LastClick;

    var _itemCount = 0;
    _this.PageCount = 0;
    var _interLength = 3;
    var _pageSize = 10;
    _this.CurrentPage = 1;

    //概览文本模板，0：总数，1:起始编号，2：结束编号
    _this.SumaryTextFormat = "显示 {1}-{2}条，共 {0} 条";

    _this.CommonSetClick = function(valid, click){
        if (valid) {
            click.style.display = "";
        }else{
            click.style.display = "none";
        }
    };

    //控制上一页链接样式，valid为true表示可用状态
    _this.SetPrevClick = _this.CommonSetClick;

    //控制下一页链接样式
    _this.SetNextClick = _this.CommonSetClick;

    //控制数字链接样式
    _this.SetNumberClick =function(valid, click){
        if (!valid) {
            click.style.fontWeight = "bold";
        }
    };

    _this.SetFirstClick = _this.CommonSetClick;
    _this.SetLastClick = _this.CommonSetClick;

    var _getPageClicks = function(minPage, maxPage) {
        var childrenCnt = _pagerClicks.childNodes.length;
        for(var i=0;i<childrenCnt;i++){
            _pagerClicks.removeChild(_pagerClicks.childNodes[0]);
        }
        var clicka = "";
        for (var i = minPage; i <= maxPage; i++) {
            clicka = document.createElement("a");
            clicka.href = "javascript:void(0)";
            clicka.innerHTML = i;
            _pagerClicks.appendChild(clicka);

            _this.SetNumberClick(_this.CurrentPage != i, clicka);

            if(_this.CurrentPage != i){
                clicka.onclick = function(){
                    _this.TurnToPage(parseInt(this.innerHTML));
                };
            }
        }
    }

    _this.SetupPager =function(itemCount, pageSize, interLength){
        _itemCount = itemCount;
        _pageSize = pageSize;
        _interLength = interLength;

        if (_itemCount % _pageSize == 0) {
            _this.PageCount = parseInt(_itemCount / _pageSize);
        } else {
            _this.PageCount = parseInt(_itemCount / _pageSize) + 1;
        }

        if(_firstClick){
            _firstClick.innerHTML = "1...";
        }

        if(_lastClick){
            _lastClick.innerHTML = "..." + _this.PageCount;
        }
    };

    var _getMinPage = function() {
        var minpage = Math.max(1, _this.CurrentPage - _interLength);
        if (_this.PageCount - _interLength < _this.CurrentPage && _this.CurrentPage <= _this.PageCount) {
            minpage = Math.max(1, _this.PageCount - 2 * _interLength);
        }
        return minpage;
    };

    var _getMaxPage = function() {
        var maxPage = Math.min(_this.PageCount, _this.CurrentPage + _interLength);
        if (1 <= _this.CurrentPage && _this.CurrentPage < _interLength + 1) {
            maxPage = Math.min(_this.PageCount, 2 * _interLength + 1);
        }

        if(maxPage == 0) return 1;
        return maxPage;
    };

    var _getSumaryText = function() {
        var sumarytxt = _this.SumaryTextFormat;
        sumarytxt = sumarytxt.replace("{1}", Math.min((_this.CurrentPage - 1) * _pageSize + 1, _itemCount));
        sumarytxt = sumarytxt.replace("{2}", Math.min(_itemCount, _this.CurrentPage * _pageSize));

        var countsmr = (_itemCount + "").replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        sumarytxt = sumarytxt.replace("{0}", countsmr);
        _pageSumaryContainer.innerHTML = sumarytxt;
    };

    _this.GetPager = function(pageIndex) {
        if(pageIndex > _this.PageCount){
            pageIndex = _this.PageCount;
        }

        if(pageIndex < 1){
            pageIndex = 1;
        }

        _this.CurrentPage = pageIndex;
        var maxPage = _getMaxPage(_this.CurrentPage);
        var minPage = _getMinPage(_this.CurrentPage);

        if(_pageSumaryContainer){
            _getSumaryText();
        }

        if(_prevClick){
            var prevClickValid = _this.CurrentPage > 1;
            _this.SetPrevClick(prevClickValid, _prevClick);

            if(prevClickValid){
                _prevClick.onclick = function(){
                    _this.TurnToPage(_this.CurrentPage - 1);
                };
            }else{
                _prevClick.onclick = function () {
                    return false;
                };
            }
        }

        if(_pagerClicks){
            _getPageClicks( minPage, maxPage);
        }

        if(_nextClick){
            var nextClickValid = _this.CurrentPage < _this.PageCount;
            _this.SetNextClick(nextClickValid, _nextClick);

            if (nextClickValid) {
                _nextClick.onclick = function(){
                    _this.TurnToPage(_this.CurrentPage + 1);
                };
            } else {
                _nextClick.onclick = function () {
                    return false;
                };
            }
        }

        if(_firstClick){
            var firstClickValid = minPage > 1;
            _this.SetFirstClick(firstClickValid, _firstClick);

            if(firstClickValid){
                _firstClick.onclick =function(){
                    _this.TurnToPage(1);
                };
            }else{
                _firstClick.onclick = function(){}
            }
        }

        if(_lastClick){
            var lastClickValid = maxPage < _this.PageCount;
            _this.SetLastClick(lastClickValid, _lastClick);

            if(lastClickValid){
                _lastClick.onclick =function(){
                    _this.TurnToPage(_this.PageCount);
                };
            }else{
                _lastClick.onclick = function(){}
            }
        }
    };

    _this.TurnToPage = new Function();
}