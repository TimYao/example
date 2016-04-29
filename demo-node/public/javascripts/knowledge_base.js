/**
 * Created by yaolx on 2015/11/13.
 *
 * knowledge porject for module javascript
 *
 * 所有功能开发基jquery模块
 *
 * 模块功能介绍：暴露主方法 init（初始化方法）、listhover(专题移入移出hover)、tabclicked（tab切换）、layer(弹层)、ajaxDelete(收录，不收录，取消收录ajax操作)
 *
 * 子模块方法：
 *  funblock 针对专家弹出模块功能构建
 *  funblock（_scrollBar滚动条，_treeMenu树形菜单生成，_sonclick tab控制,_opdate tab数据操作,_rubdate垃圾删除，_ajax初始化请求,_submitform后端表单提交数据）
 *
 * 外层调用模式
 *  window.csdn.knowledge_web暴漏方法
 *
 */

(function(golbal,unf){
  var g, $,doc,csdn,exports={},knowledge_web;
  g = golbal ? golbal : 'window';
  doc = g.document || unf;
  $ = g.jQuery ? g.jQuery : unf;
  csdn = g.csdn || exports;
  $(function(){
      (function(fun){
          fun(g,$,unf);
          csdn.knowledge_web = csdn['knowledge_web'] || {};
          for(var c in knowledge_web)
          {
              exports[c] = csdn.knowledge_web[c] = knowledge_web[c];
          }
          exports.init();
      })(function(g,$,unf){
          knowledge_web = {
              init:function(fn){ //fn用于回调做填入操作
                  var This = this;
                  //数据内容记录
                  This.recordingArr = [];
                  //数据ID记录，与后端发送数据
                  This.recordIds = [];
                  //请求地址参数
                  This.urls = {
                      treeurl:'/expert/initTree' //树级菜单请求
              };
                  this.layer(function(obj){
                      var funblock = This.funblock();
                      //obj返回操作条目的对象
                      _id = obj.tagobj.attr('data-id');
                      _types = obj.tagobj.attr('data-type') || 0;
                      This.recordIds.push(_id);
                      _windowLayer = obj.windowLayerid;
                      //请求数据  一级树菜单
                      funblock._ajax({
                          _url:This.urls['treeurl'],
                          _id:_id,
                          _types:_types
                      },function(reponse){
                          var re = reponse,
                              status = re.status,
                              title = re.title,
                              html = re.html,
                              selectedhtml = re.selectedhtml;
                          if(status)
                          {
                              $("#"+_windowLayer+' .title em').html('');
                              $("#"+_windowLayer+' .scrollMenu').html('');
                              $("#"+_windowLayer+' .selectlist ul').html('');
                              $("#"+_windowLayer+' .title em').html(title);
                              $("#"+_windowLayer+' .scrollMenu').append($(html));
                              $("#"+_windowLayer+' .selectlist ul').html($(selectedhtml));
                          }
                          funblock._scrollBar();//滚动调用
                          funblock._treeMenu();//树形菜单调用
                          //_ 垃圾删除
                          funblock._rubdate(function(reponse){
                              var re = (typeof reponse).toLowerCase()==="object" ? reponse : eval('('+reponse+')'),
                                  status = re.status,
                                  tabid = re.tabid || '';
                              if(status)
                              {
                                  if($(".listselect li a[data-id="+tabid+"]").length>0)
                                  {
                                      $(".listselect li a[data-id="+tabid+"]").removeClass('root');
                                      $(".listselect li a[data-id="+tabid+"]")[0].tag = false;
                                  }
                                  funblock._scrollBar();//滚动调用
                              }
                          });
                      });
                      //滚动调用
                      funblock._scrollBar();
                      //提交触发
                      funblock._submitform();
                  });
              },
              funblock:function(){
                  var This = this;
                  return {
                      _scrollBar:function(){
                          var addScroll;
                          addScroll = $('.addScroll') || unf;
                          addScroll.each(function(i,obj){
                              addScrollFun($(obj));
                          });
                          function addScrollFun(obj) {
                              var scrollDoc, wrapDocHeight, docHeight, scrollblank, scrollbars;
                              scrollDoc = obj.find('.scrollDoc') || unf;
                              wrapDocHeight = parseFloat(obj.outerHeight(), 10);
                              docHeight = parseFloat(scrollDoc.outerHeight(), 10);
                              scrollblank = obj.find('.scrollblank') || unf;
                              scrollbars = obj.find('.scrollbars') || unf;
                              scrollbars.pro = 0;
                              scrollDoc.max = docHeight-wrapDocHeight;
                              scrollbars.max = parseFloat(scrollblank.outerHeight(),10)-parseFloat(scrollbars.height(),10);
                              if (docHeight > wrapDocHeight) {
                                  scrollbars.removeClass('hide');
                                  startScroll();
                              } else {
                                  scrollbars.addClass('hide');
                                  return false;
                              }
                              function startScroll()
                              {
                                  function mouseMoveFun(){
                                      $(doc).on('mousemove',function(event){
                                          var y = scrollbars.y;
                                          var t = event.clientY-y;
                                          if(t<=0)
                                          {
                                              t = 0;
                                          }
                                          if(t>scrollbars.max)
                                          {
                                              t = scrollbars.max;
                                          }
                                          scrollbars.pro = t/scrollbars.max;
                                          scrollbars.css({"top":t});
                                          scrollDoc.css({"top":-scrollbars.pro*(scrollDoc.max)});
                                          event.stopPropagation();
                                          return false;
                                      });
                                      $(doc).on('selectstart',function(){
                                          return false;
                                      });
                                  };
                                  function mouseupFun(){
                                      $(doc).off('mousemove');
                                  };
                                  scrollbars.on('mousedown',function(event){
                                      scrollbars.y = event.clientY-parseFloat($(this).position().top,10);
                                      mouseMoveFun();
                                      event.stopPropagation();
                                      return false;
                                  });
                                  $(doc).on('mouseup',function(event){
                                      mouseupFun();
                                      event.stopPropagation();
                                      return false;
                                  });
                              }
                          }

                      },
                      _treeMenu:function(fn){
                          var _This = this,
                              _url = This.urls['treeurl'];
                          $(".treeMenu li a").each(function(i,obj){
                              if((($(this).parent().parent())[0].tagName).toLowerCase()==="ul" && !$(obj).hasClass('noclick'))
                              {
                                  obj.flg = false;
                              }
                          });
                          $(doc).off('click');
                          $(doc).on('click','.treeMenu li a',function(event){
                              _id = $(this).attr('data-mid');
                              _type = $(this).attr('data-type');
                              _this = $(this);
                              menuajax({
                                  _id:_id,
                                  _type:_type,
                                  _url:_url
                              },function(reponse){
                                  var re = reponse,
                                      status = re.status,
                                      html = re.html,
                                      treelayer = re.treelayer;  //控制是否有树级下级菜单
                                  if(status)
                                  {
                                      if(treelayer===false)
                                      {
                                          $(".listselect").prev('.coltitle').removeClass('hide');
                                          $(".listselect").show();
                                          $(".listselect").html('');
                                          $(".listselect").html($(html));
                                          This.recordingArr = [];
                                          $(_this).parents('li').each(function(i,obj){
                                              This.recordingArr.unshift($(obj).children('a').find('em').html());
                                          });
                                          //tab标签控制
                                          _This._sonclick();
                                          //滚动调用
                                          _This._scrollBar();
                                          return false;
                                      }else{
                                          _this.next().remove();
                                          _this.parent().append($(html));
                                      }
                                      if($(_this).next().length<=0)
                                      {
                                          return false;
                                      }
                                      //排除不能点击项
                                      if($(_this).hasClass('noclick'))
                                      {
                                          return false;
                                      }
                                      $(_this)[0].flg==unf ||$(_this)[0].flg == false ? ($(_this).addClass('lessj'),$(_this).parent().children('ul').show(),$(_this)[0].flg=true) : ($(_this).removeClass('lessj'),$(_this).parent().children('ul').hide(),$(_this)[0].flg=false);
                                      _This._scrollBar();//滚动调用
                                  }
                              });
                              event.stopPropagation();
                              event.preventDefault();
                              return false;
                          });
                          function menuajax(options,fn)
                          {
                              _id = options._id;
                              _url = options._url;
                              _type = options._type;
                              $.ajax({
                                  url:_url,
                                  type:'get',
                                  async:true,
                                  data:{
                                      mid:_id,
                                      node_type:_type
                                  },
                                  success:function(reponse){
                                      fn?fn(reponse):'';
                                  },
                                  error:function(){
                                      alert('树形菜单请求失败!')
                                  }
                              });
                          }
                      },
                      _sonclick:function(){
                          var listselect = $('.listselect') || unf,
                              subclick,
                              selectlist = $(".selectlist ul > li"),
                              _This = this;
                          if(listselect.length<=0)
                          {
                              return false;
                          }
                          subclick = listselect.children().find('a');
                          //控制是否tab可点击/并匹配是否重复点击
                          subclick.each(function(i,obj){
                              var _tabid = $(obj).attr('data-id');
                              selectlist.each(function(j,ob){
                                  var _uid = $(ob).attr("data-tabid");
                                  if(_uid == _tabid)
                                  {
                                      $(obj).addClass('root');
                                      obj.tag = true;
                                  }
                              });
                          });

                          subclick.on('click',tabclicks);
                          function tabclicks(event)
                          {
                              var _this,text,
                                  _this = $(this),
                                  text = $(this).parent().children('.subc').html(),
                                  _id = $(this).attr('data-id');
                              if(_this[0].tag)
                              {
                                  return false;
                              }
                              _this.addClass('root');
                              //操作插入删除数据
                              _This._opdate({
                                  text:text,
                                  id : _id
                              },function(){
                                  var id = _this.attr('data-id');
                                  _this[0].tag = true;
                                  _This._scrollBar();
                              });
                              event.stopPropagation();
                              event.preventDefault();
                              return false;
                          }
                      },
                      _opdate:function(options,fn){
                          var ul = $(".selectlist ul"),
                              lis = ul.children(),
                              _This = this,
                              _html='',
                              text = options.text || '',
                              id = options.id || 0;
                          for(var i=0;i<This.recordingArr.length;i++)
                          {
                              _html+=This.recordingArr[i]+" - ";
                          }
                          var ob = $("<li class='clearfix' data-tabid="+id+"><span>"+_html+"<em>"+text+"</em></span><a href='' class='rubbish'></a></li>");
                          lis.length>0 ? (ob.insertBefore(lis.eq(0))):ul.append(ob);
                          fn?fn():'';
                      },
                      _rubdate:function(fn){
                          $(doc).on('click','.selectlist li .rubbish',function(event){
                              var id = Number($(this).parent().attr('data-id'),10),
                                  _this = $(this),
                                  tabid;
                              tabid = _this.parent().attr('data-tabid');
                              $(this).parent().empty().remove();
                              fn?fn({status:true,tabid:tabid}):'';
                              event.stopPropagation();
                              event.preventDefault();
                              return false;
                          });
                      },
                      _ajax:function(options,fn){
                          _id = options._id;
                          _url = options._url;
                          _types = options._types;
                          _appendDom = options._appendDom;
                          $.ajax({
                              type:'get',
                              async:true,
                              url:_url,
                              data:{
                                  dataid:_id,
                                  _types:_types
                              },
                              success:function(reponse){
                                  //回调
                                  fn(reponse);
                              },
                              error:function(){
                                  alert('服务器请求失败');
                              }
                          });
                      },
                      _submitform:function(){
                          var _This = this,
                              kid = This.recordIds.shift(),
                              subhide = $("#subhide");
                          if(subhide.length<=0)
                          {
                              alert("缺少提交域!");
                              return false;
                          }
                          $("#subClick").on('click',function(event){
                              This.recordIds = [];
                              $(".selectlist ul li").each(function(i,obj){
                                  var tabid = $(obj).attr('data-tabid');
                                  This.recordIds[i] = '['+kid+','+tabid+']';
                              });
                              //最后提交数据
                              //subhide.val('');
                              //subhide.val(This.recordIds.join(","));
                              $.ajax({
                                  url:'/expert/doMangeKl',
                                  type:'post',
                                  data:{
                                      knowledge_ids:This.recordIds.join(","),
                                      expert:kid
                                  },
                                  success:function(response)
                                  {
                                      var res = response,
                                          succ = parseInt((res.succ),10),
                                          msg;
                                      succ >0 ? (window.location.reload()) : (msg = res.msg,alert(msg));
                                  },
                                  err:function(err)
                                  {
                                      alert(err);
                                  }
                              });
                              //$(this).parents('form').submit();
                              event.stopPropagation();
                              event.preventDefault();
                              return false;
                          });
                      }
                  };
              },
              layer:function(fn){
                var This = this;
                $(doc).on('click','.tagclick',function(event){
                    var windowLayerTag = "windowLayer",windowLayer,marklayer,dateid,obj;
                    var datalayerid = $(this).attr('data-layer-id') || '';
                    var datatype = $(this).attr('data-type') || 0;
                    windowLayer = $("."+windowLayerTag) || '';
                    marklayer = $(".marklayer") || '';
                    if(windowLayer.length<=0 || marklayer.length<=0)
                    {
                        alert('请添加弹框的DOM格式');
                        return false;
                    }else if(marklayer.length>1 || windowLayer.length>1)
                    {
                        alert('弹框和遮罩请唯一');
                        return false;
                    }
                    //弹框唯一性
                    dateid = datalayerid ? datalayerid : '';
                    windowLayer.attr({'id':windowLayerTag+datalayerid,'data-id':dateid,'data-type':datatype});
                    $("#"+windowLayerTag+datalayerid).show();
                    marklayer.css({"height":$(g).height()}).show();
                    $(".closec").off('click');
                    $(".closec").on('click',function(event){
                        $("#"+windowLayerTag+datalayerid).hide();
                        marklayer.hide();
                        event.stopPropagation();
                        event.preventDefault();
                        return false;
                    });
                    obj = {
                        'tagobj' : $(this),
                        'windowLayerid':windowLayerTag+datalayerid
                    };
                    fn?fn(obj):'';
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                });
              }
          };
      });
  });
})(window);