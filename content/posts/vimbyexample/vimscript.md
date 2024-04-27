---
title: 'Vimscript'
date: 2024-04-15T16:33:59+08:00
draft: false
tags: 
  - vimscript
categories:
  - vim
---

You can run these scripts in vim editor in [normal mode](https://www.freecodecamp.org/news/vim-editor-modes-explained/#normal-mode).

```vim
:source hi.vim
```

Or you can use:

```shell
vim -e -c 'redir >> /dev/stdout' -S hi.vim -c 'q'
```

or

```shell
vim -e '+redir >> /dev/stdout' -S hi.vim '+q'
```

## Examples

[Hi](../hi.vim)

## Reference

[Learn Vimscript the Hard Way](https://learnvimscriptthehardway.stevelosh.com/chapters/00.html)
[VimL Learn](https://lymslive.github.io/vimllearn)
[Learn X in Y minutes](https://learnxinyminutes.com/docs/vimscript/)
[Vim scripting cheatsheet](https://devhints.io/vimscript)
