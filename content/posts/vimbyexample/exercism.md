---
title:     'Learn Vimscript on Exercism'
date:      2024-04-26T17:43:14+08:00
author:    Cedric
draft:     false
summary: "使用 Exercism CLI 下载、练习和提交 Vimscript 题目，并了解其采用的 Vader 测试工具。"
categories: vimbyexample
tags:
  - vimbyexample
  - exercism
---
## install exercism

```bash
brew install exercism
exercism configure --token=<go to https://exercism.org/settings/api_cli>
exercism download --track=vimscript --exercise=hello-world
```

Default download path is `$HOME/Exercism/vimscript/hello-world`.
After finishing the example.

```bash
exercism submit hello_world.vim
```

Get all exercises from [website](https://exercism.org/tracks/vimscript/exercises).

exercism use [Vader](https://github.com/junegunn/vader.vim) as a test tool for Vimscript.
