知识库 后端
===========

目录结构说明

- `biz` 业务处理相关
    - `conf` 服务器配置
    - `routes` http请求路由
    - `models` 业务逻辑处理
    - `utility` 公共方法
- `public` 公开目录，包含image，js，css
- `views` 视图目录，包含html
- `logs` 日志记录
- `node_modules` 项目依赖的模块
- `package.json` 项目依赖的模块信息


功能模块说明

1. 数据设计
     - `knowledge`
       - `id`           自增长ID
       - `parent_id`   父类ID
       - `name`         名称
       - `description`  描述
       - `created_at`   创建时间
       - `opreater`     创建者
       - `updated_at`   更新时间
       - `status`       状态 0未生效 1生效 2删除
     - `article`
       - `id`           自增长ID
       - `type`         内容类型： 1文章 2视频 3文档 4问答 5代码
       - `title`        内容标题  -TODO 如果有些标题可以编辑，要定时更新
       - `url`          内容链接
       - `knowledge_id` 所属知识点
       - `opreater`     添加者
       - `created_at`   添加时间
       - `status`       状态
     - `expert`
       - `id`          自增长ID
       - `username`     CSDN用户名
       - `realname`     真实姓名
       - `introduction` 专家介绍
       - `avatar_url`  专家头像
       - `knowledge_id` 知识点ID(可多个)
       - `opreater`     创建者
       - `created_at`   创建时间
       - `updated_at`   更新时间
     - `user`
       - `id`           自增长ID
       - `username`     CSDN用户名
       - `knowledge_id` 订阅知识点ID(单个)
       - `created_at`   创建时间

2. express app.js 配置 (session, express-autorout等)
3. 验证登录
4. beta_admin验证
5. 知识库(分级管理)
   - 列表页
     - 发布(ajax)
   	 - 删除(ajax)
   - 新建
   - 编辑
   - 分类
   - 知识点
     - 列表
     - 新建
     - 分配
6. 专家管理
   - 列表
   - 新建
   - 编辑
7. 收录内容
   - 列表
   - 搜索
   - 排序
8. 专题管理
   - 列表 
   - 子专题创建(弹层)
   - 子专题列表
     - 发布
     - 编辑
   - 添加内容
6. 操作日志

#TODO

每个页面需写routes路由机制, models业务逻辑和view页面以及数据渲染。
