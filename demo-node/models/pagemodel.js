module.exports = function(options){
    var _this = this;
    var _pageCount;
    var _minPage;
    var _maxPage;
    var _linkFormat = options.linkformat;
    var _querys = options.querys;

    _this.ItemCount = options.itemcount;
    _this.PageSize = options.size? options.size: 10;
    _this.IntervalLength = options.sidelen? options.sidelen: 2;
    _this.StartIndex = options.startindex? options.startindex: 1;
    _this.currentIndex =options.current;

    if (_this.ItemCount % this.PageSize == 0)
    {
        _this.PageCount  = Math.floor(_this.ItemCount / _this.PageSize);
    }
    else
    {
        _this.PageCount  = Math.floor(_this.ItemCount / _this.PageSize) + 1;
    }

    _minPage = Math.max(_this.StartIndex, _this.currentIndex - _this.IntervalLength);
    if (_this.PageCount - _this.IntervalLength < _this.currentIndex - _this.StartIndex + 1 && _this.currentIndex - _this.StartIndex + 1 <= _this.PageCount)
    {
        _minPage = Math.max(_this.StartIndex, _this.PageCount - 2 * _this.IntervalLength + _this.StartIndex - 1);
    }

    _maxPage = Math.min(_this.PageCount + _this.StartIndex - 1, _this.currentIndex + _this.IntervalLength);
    if (0 <= _this.currentIndex - _this.StartIndex && _this.currentIndex - _this.StartIndex < _this.IntervalLength)
    {
        _maxPage = Math.min(_this.PageCount + _this.StartIndex - 1, 2 * _this.IntervalLength + _this.StartIndex);
    }

    if (_maxPage < _this.StartIndex)
    {
        _maxPage = _this.StartIndex;
    }

    var getLinkUrl = function(page){
        var result = _linkFormat.replace(':page', page);
        if(_querys){
            for(var qn in _querys){
                if(typeof(_querys[qn]) == "string" && qn!="page"){
                    result = _setQueryParam(result, qn, _querys[qn]);
                }
            }
        }
        return result;
    };

    var _getQueryParam = function (locationstr, p) {
        var regex = new RegExp("[\?\&]" + p + "(?:=([^\&]*))?", "i");
        var match = regex.exec(locationstr);
        var value = null;
        if (match != null && match.length > 0) {
            value = decodeURIComponent(match[1]);
        }
        return value;
    };

    var _setQueryParam = function (locationstr,  p, newvalue){
        var trimregex = new RegExp("[\#|\&|\?]*$");
        locationstr = locationstr.replace(trimregex,  "");

        if(newvalue != null && newvalue.length > 0){
            var paramvalue = _getQueryParam(locationstr,  p);
            if(paramvalue != null){
                var regex = new RegExp("([\?\&])" + p + "(?:=([^\&]*))?", "i");
                locationstr = locationstr.replace(regex, "$1" + p + "=" + encodeURIComponent(newvalue));
            }else{
                if(locationstr.indexOf("?") > 0){
                    locationstr = locationstr + "&";
                }else{
                    locationstr = locationstr + "?";
                }
                locationstr = locationstr + p + "=" +  encodeURIComponent(newvalue);
            }
        }else{
            locationstr = _deleteQueryParm(locationstr, p);
        }
        return locationstr;
    };

    var _deleteQueryParm = function(locationstr,  p){
        var trimregex = new RegExp("[\#|\&|\?]*$");
        var regex = new RegExp("([\?\&])" + p + "(?:=([^\&]*))?\&?", "i");
        locationstr = locationstr.replace(regex, "$1");
        locationstr = locationstr.replace(trimregex,  "")
        return locationstr;
    };

    _this.DisplayCurrentIndex =  _this.currentIndex - _this.StartIndex + 1;

    _this.DisplayFromIndex =  Math.min((_this.currentIndex - _this.StartIndex) * _this.PageSize + 1, _this.ItemCount);

    _this.DisplayToIndex = Math.min(_this.ItemCount, (_this.currentIndex - _this.StartIndex + 1) * _this.PageSize);

    _this.FirstPageLink = { text: "首页"
            , url: getLinkUrl( _this.StartIndex)
            , isvalid: (_this.currentIndex > _this.StartIndex && _minPage > _this.StartIndex)
        };

    _this.PreviousPageLink = {text: "上一页"
            , url: getLinkUrl(_this.currentIndex - 1)
            , isvalid: (_this.currentIndex > _this.StartIndex)
        };

    _this.NexusPageLink = {text: "下一页"
            , url: getLinkUrl(_this.currentIndex - 0 + 1)
            , isvalid: (_this.currentIndex - _this.StartIndex + 1 < _this.PageCount)
        };

    _this.LastPageLink = {text: "末页"
            , url: getLinkUrl(_this.PageCount + _this.StartIndex - 1)
            , isvalid: (_this.currentIndex - _this.StartIndex + 1 < _this.PageCount && _maxPage < _this.PageCount + _this.StartIndex - 1)
        };

    _this.PageLinks = [];

    for (var i = _minPage, len = _maxPage; i <= len; i++)
    {
        _this.PageLinks.push({text: (i - _this.StartIndex + 1)
            , url: getLinkUrl(i)
            , isvalid: _this.currentIndex != i
        });
    }

    return _this;
}