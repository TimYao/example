/*!
* Larky PopWindow v1.0.0
* http://larky.com/
*
* Copyright 2011, Larky Liu
* Date: Mon Mar 20 8:11:03 2012
*/

/*
调用示例：
    var mypop = new ppWindow(
    {
        DivInnerHTML: $("#divtemplate").text() //DivInnerHTML与DivElement二选一
        //DivElement: $("#userdefinediv")[0]  //DivInnerHTML与DivElement二选一
        ,Position: {top: 50 ,left: 250} //选填
        ,PositionModify: {top: 10, left: 10} //选填
        ,ClassName: "divc" //选填
        ,TopContainer: $("#fatherDIv")[0] //选填 如果要使用div里嵌套内容来相对定位
        //, SenderElement:$("#search")[0]//选填 如果为空，则自己使用下面的语句绑定事件
    });

    $("#search").click(function(e){ //可以给多个对象绑定事件        
        mypop.show(e);
    });
*/
    function ppWindow(parms)
    {
        //私有变量
        var _this = this;
        var _divElement;
        var _divClassName;
        var _clickSelfHide = false;
        var _funcItemClicked = parms.FuncItemClicked
        var _zIndex = 9999;
        var _container = parms.TopContainer;
        var _sender = parms.SenderElement;

        if(parms.ZIndex != null)
        {
            _zIndex = parms.ZIndex;
        }

        if( parms.ClickSelfHide != null)
        {
            _clickSelfHide = parms.ClickSelfHide;
        }

        if(parms.ClassName != null)
        {
            _divClassName = parms.ClassName;
        }

        //可使用页面中div也可动态创建
        if(parms.DivElement == null)
        {
            _divElement = document.createElement("div");
            _divElement.innerHTML = parms.DivInnerHTML;
            $(_divElement).appendTo($(document.body));
        }
        else
        {
            _divElement = parms.DivElement;
        }

        _divElement.style.position = "absolute";
        _divElement.style.display= "none";
        if(_divClassName != null)
        {
            _divElement.className = _divClassName;
        }

        if(_zIndex != null)
        {
            _divElement.style.zIndex = _zIndex;
        }

        //触发div显示的源
        var _srcParent= null;
        
        var comparePosition = function(a, b){
         return a.compareDocumentPosition ?
         a.compareDocumentPosition(b) :
         a.contains ?
          ( a != b && a.contains(b) && 16 ) +
          ( a != b && b.contains(a) && 8 ) +
          ( a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
           (a.sourceIndex < b.sourceIndex && 4 ) +
           (a.sourceIndex > b.sourceIndex && 2 ) :
           1 ) :
          0;
        };

        _this.hide = function(e)
        {
            $(_divElement).hide();
        }

        //计算弹出的位置
        _this.PopPlacement = function(clicksrc, popwindow, container){          
            var positionvalue = {top:0, left:0, direction:{horizon:"right", vertical:"down"}};
            if(parms.PutNearBy){
                var mcontainer = $(popwindow.parentNode).closest("*[style*='absolute'],*[style*='relative']");
                if(mcontainer.length > 0){
                    positionvalue.top = $(clicksrc).offset().top + $(clicksrc).outerHeight() - mcontainer.offset().top;
                    positionvalue.left = $(clicksrc).offset().left -  mcontainer.offset().left;

                    //下方空间不够，向上弹出
                    if(container == null && positionvalue.top + $(popwindow).outerHeight() + mcontainer.offset().top - $(window).scrollTop()> $(window).height() ||
                    container != null && positionvalue.top + $(popwindow).outerHeight() + mcontainer.offset().top - $(container).offset().top > $(container).height())
                    {
                        positionvalue.top = $(clicksrc).offset().top - $(popwindow).outerHeight() - mcontainer.offset().top;
                        if(positionvalue.top < 0)
                        {
                            positionvalue.top = 0;
                        }
                        positionvalue.direction.vertical = "top";
                    }

                    //左方空间不够，向左弹出
                    if(container == null && positionvalue.left + $(popwindow).outerWidth() +mcontainer.offset().left - $(window).scrollLeft()> $(window).width() ||
                        container != null && positionvalue.left + $(popwindow).outerWidth()  +mcontainer.offset().left- $(container).offset().left > $(container).width())
                    {
                        positionvalue.left = $(clicksrc).offset().left - ($(popwindow).outerWidth() - $(clicksrc).outerWidth())  - mcontainer.offset().left;
                        if(positionvalue.left < 0)
                        {
                            positionvalue.left = 0;
                        }
                        positionvalue.direction.horizon = "left";
                    }
                }
            }else{
                positionvalue.top = $(clicksrc).offset().top + $(clicksrc).outerHeight();
                positionvalue.left = $(clicksrc).offset().left;

                //下方空间不够，向上弹出
                if(container == null && positionvalue.top + $(popwindow).outerHeight() - $(window).scrollTop()> $(window).height() ||
                    container != null && positionvalue.top - $(container).offset().top + $(popwindow).outerHeight() > $(container).height())
                {
                    positionvalue.top = $(clicksrc).offset().top - $(popwindow).outerHeight();
                    if(positionvalue.top < 0)
                    {
                        positionvalue.top = 0;
                    }
                    positionvalue.direction.vertical = "top";
                }

                //左方空间不够，向左弹出
                if(container == null && positionvalue.left + $(popwindow).outerWidth() - $(window).scrollLeft()> $(window).width() ||
                    container != null && positionvalue.left - $(container).offset().left + $(popwindow).outerWidth() > $(container).width())
                {
                    positionvalue.left = $(clicksrc).offset().left - ($(popwindow).outerWidth() - $(clicksrc).outerWidth());
                    if(positionvalue.left < 0)
                    {
                        positionvalue.left = 0;
                    }
                    positionvalue.direction.horizon = "left";
                }
            }
            
            
            return positionvalue;
        }

        _this.show = function(e)
        {
            var e0=e?e:window.event;
            _srcParent = e0.srcElement||e0.target;

            var position = _this.PopPlacement(_srcParent, _divElement, _container);
            var vleft = position.left;
            var vtop = position.top;
            
            //空间不够会自动翻转到上边或者左边
            _this.GetDirectionStyle(position.direction.horizon);
            _this.GetDirectionStyle(position.direction.vertical);

            //固定坐标
            if(parms != null && parms.Position != null)
            {
                vleft = parms.Position.left;
                vtop = parms.Position.top;
            }

            //坐标修正
            if(parms != null && parms.PositionModify != null)
            {
                vleft = vleft + parms.PositionModify.left;
                vtop = vtop + parms.PositionModify.top;
            }

            _divElement.style.top = vtop + "px";
            _divElement.style.left = vleft + "px";
            $(_divElement).show();
        }

        if(_container != null)
        {
            $(_container).scroll(function(e){
                if(_divElement.style.display == "none")
                {
                    return;
                }
                _divElement.style.display = "none";
            });
        }

        if(_sender != null){            
            $(_sender).click(function (e) {
                if (_divElement.style.display == "none") {
                    _this.show(e);
                } else {
                    _this.hide();
                }
            });
        }

        //隐藏
        $(document).click(function(e){
            //_srcParent为空意味着目前div未显示过，不用进行隐藏
            if( _srcParent == null)
            {
                return;
            }

            //目前div未显示，不用处理
            if(_divElement.style.display == "none")
            {
                return;
            }
            
            var e1 = e?e:window.event;
            var src = e1.srcElement||e1.target;

            //点击源来自显示事件的源
            if(src == _srcParent || comparePosition(_srcParent, src) == 20)
            {
                return;
            }
            
            if(_divElement == src || comparePosition(_divElement, src) == 20)//点击来自内部
            {
                if(_funcItemClicked != null)//响应点击事件
                {
                    var liElement;
                    if(src.tagName == "LI")
                    {
                        liElement = src;
                    }

                    //多选框专用
                    if(src.tagName == "INPUT" && src.parentElement.tagName == "LI")
                    {
                        liElement = src.parentElement;
                    }
                    
                    if(liElement != null)
                    {
                        if(liElement.tagName == "LI" && $(liElement).attr("ItemValue") != null)
                        {
                            _funcItemClicked($(liElement).attr("ItemValue"), e);
                        }
                    }
                }

                if(!_clickSelfHide)
                {
                    return;
                }
            }

            $(_divElement).hide();
        });

        //弹窗显示方向控制，输入参数值（字符串）：left,right,up,down
        _this.GetDirectionStyle = new Function();
    }
