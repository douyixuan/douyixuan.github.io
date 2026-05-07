---
title:     'Learn Vimscript on Exercism'
date:      2024-04-26T17:43:14+08:00
author:    Cedric
draft:     false
summary: "待补充：本文摘要"
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
