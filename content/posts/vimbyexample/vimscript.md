---
title: 'Vimscript'
date: 2024-04-15T16:33:59+08:00
draft: false
tags: 
  - vimscript
categories:
  - vim
---

Try these scripts in vim editor.

In normal mode and type

```vim
:source hi.vim
```

you can see the result.
Or you can use:

```shell
vim -e -c 'redir >> /dev/stdout' -S hi.vim -c 'q'
````
or
```shell
vim -e '+redir >> /dev/stdout' -S hi.vim '+q'
```

## Reference

[Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/chapters/00.html)
[VimL Learn](https://lymslive.github.io/vimllearn)
