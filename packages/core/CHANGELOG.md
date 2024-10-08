

## [0.1.4](https://github.com/humandetail/mentions/compare/mentions.js-0.1.3...${npm.name}-0.1.4) (2024-09-27)


### Bug Fixes

* 语义化下拉选框中的label和valueg带来的影响 [#10](https://github.com/humandetail/mentions/issues/10) ([4974a15](https://github.com/humandetail/mentions/commit/4974a153e8dc86ad4c7ed042c6d8d15f3258d504))

## [0.1.3](https://github.com/humandetail/mentions/compare/mentions.js-0.1.2...${npm.name}-0.1.3) (2024-08-12)

## [0.1.2](https://github.com/humandetail/mentions/compare/mentions.js-0.1.1...${npm.name}-0.1.2) (2024-08-05)


### Bug Fixes

* 获取RegExp时缺少prefix参数 ([e85897b](https://github.com/humandetail/mentions/commit/e85897bdb2dc5bec71de670c8512da416fa33af3))

## [0.1.1](https://github.com/humandetail/mentions/compare/mentions.js-0.1.0...${npm.name}-0.1.1) (2024-08-05)


### Bug Fixes

* disabled options don't selectable ([6dc1032](https://github.com/humandetail/mentions/commit/6dc103288cec54e0aabc690cb41f53a49728f006))
* fixed an issue that could not be echoed normally after modifying label/value field name ([8c94a43](https://github.com/humandetail/mentions/commit/8c94a43bb4ca4aafe6324998095f8099d79199cb))
* label 和 value 字段混淆 ([2fafe79](https://github.com/humandetail/mentions/commit/2fafe791208bc30adbd7a72c75ddd5c0d52027ee))

# [0.1.0](https://github.com/humandetail/mentions/compare/mentions.js-0.0.2...${npm.name}-0.1.0) (2024-03-29)


### Bug Fixes

* 修复中文输入法下输入@会在搜索框中也出现@的问题 ([3b8e697](https://github.com/humandetail/mentions/commit/3b8e69786be380e7bf833330610373d31fb6aad8))
* labelFieldName valueFieldName disabled readonly 等字段设置bug ([86c2682](https://github.com/humandetail/mentions/commit/86c2682374bb1a2cbc73507784fa4f88de522476))
* vitepress启动错误 ([307c892](https://github.com/humandetail/mentions/commit/307c892bead6022a0f3f00f11d23fbffc5283eac))

## 0.0.2 (2023-05-30)


### Bug Fixes

* 修复数据在达到最大输入长度时页面中的内容没有被重置的问题 ([55e1460](https://github.com/humandetail/mentions/commit/55e14601f0448bc34ab5f3ed01f0e7b274092fbb))
* 修复在中文输入法下组合输入时输入框中会出现多个@符号的问题 ([34a3f5c](https://github.com/humandetail/mentions/commit/34a3f5cab38e2106d01707fae792cd3cacedbb51))
* options列表空时，焦点位置问题 & dropdown 里面的样式调整 ([b5d7903](https://github.com/humandetail/mentions/commit/b5d7903a2c2eca6e646c7fda5618a68c556d46f3))


### Features

* 增加mentions-change 事件，完善value change 逻辑 ([6b9dc06](https://github.com/humandetail/mentions/commit/6b9dc06dbb4d3166e67a57c5230e1f2f72ed96d3))
* dropdown重做,提取dropdown单独管理 ([b9f5052](https://github.com/humandetail/mentions/commit/b9f505254d5fc086be3b6fc8d0e58ade0ac9dccf))
* max-length约束 ([2772cf5](https://github.com/humandetail/mentions/commit/2772cf54f18f787c0f11577d83dbfede8457573a))