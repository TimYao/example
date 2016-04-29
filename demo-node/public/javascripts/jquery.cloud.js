(function ($) {
    $.fn.center = function () {
        return this.each(function () {
            var $this = $(this);
            $this.css("position", "absolute");
            $this.css("top", (($(window).height() - $this.outerHeight()) / 2) + $(window).scrollTop() + "px");
            $this.css("left", (($(window).width() - $this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
           
            $this.show();
            return $this;
        });
    }

})(jQuery);


$.extend(
{
    PageSize: function () {
        var width = 0;
        var height = 0;
        width = window.innerWidth != null ? window.innerWidth : document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body != null ? document.body.clientWidth : null;
        height = window.innerHeight != null ? window.innerHeight : document.documentElement && document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body != null ? document.body.clientHeight : null;
        return { Width: width, Height: height };
    }
, ScrollPosition: function () {
    var top = 0, left = 0;
    if ($.support.mozilla) {//$.browser  //jquery1.9之后用$.support
        top = window.pageYOffset;
        left = window.pageXOffset;
    }
    else if ($.support.msie) {
        top = document.documentElement.scrollTop;
        left = document.documentElement.scrollLeft;
    }
    else if (document.body) {
        top = document.body.scrollTop;
        left = document.body.scrollLeft;
    }
    return { Top: top, Left: left };
}
});

jQuery.fn.extend(
{
    modalShow: function () {
        return this.each(function () {
            $this = $(this);
            var sWidth, sHeight;
            sWidth = window.screen.availWidth;
            if (window.screen.availHeight > document.body.scrollHeight) {
                sHeight = window.screen.availHeight;
            } else {
                sHeight = document.body.scrollHeight + 20;
            }
            var $maskdiv = $("<div id='div_modalShow'></div>")
            $maskdiv.appendTo('body');
            $maskdiv.css("position", "absolute");
            $maskdiv.css("top", "0");
            $maskdiv.css("left", "0");
            $maskdiv.css("background", "#111");
            $maskdiv.css("filter", "Alpha(opacity=70);");
            $maskdiv.css("opacity", "0.7");
            $maskdiv.css("width", sWidth);
            $maskdiv.css("height", sHeight);
            $maskdiv.css("zIndex", "10000");

            $("body").attr("scroll", "no");

            $("#div_modalShow").data("divbox_selectlist", $("select:visible"));
            $("select:visible").hide();
            $("#div_modalShow").attr("divbox_scrolltop", $.ScrollPosition().Top);
            $("#div_modalShow").attr("divbox_scrollleft", $.ScrollPosition().Left);
            $("#div_modalShow").attr("htmloverflow", $("html").css("overflow"));
            $("html").css("overflow", "hidden");
            window.scrollTo($("#div_modalShow").attr("divbox_scrollleft"), $("#div_modalShow").attr("divbox_scrolltop"));

            $this.css("position", "absolute");
            $this.css("top", (($(window).height() - $this.outerHeight()) / 2) + $(window).scrollTop() + "px");
            $this.css("left", (($(window).width() - $this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
            $this.css("z-index", "10001");
            $this.show();
            return $this;
        });
    },
    modalClose: function () {
        return this.each(function () {
            $this = $(this);
            $this.hide();
            $("html").css("overflow", $("#div_modalShow").attr("htmloverflow"));
            window.scrollTo($("#div_modalShow").attr("divbox_scrollleft"), $("#div_modalShow").attr("divbox_scrolltop"));
            $("#div_modalShow").data("divbox_selectlist").show();
            $("#div_modalShow").remove();
        });
    }
});
